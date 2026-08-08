"""
MISST NOAA GOES-19 GLM L2 LCFA -> lightningWebhook relay (data adapter ONLY).

Receives NewGOES19Object SNS notifications, downloads GLM L2 LCFA NetCDF4 files,
extracts flash records, filters to a configurable bbox, and POSTs a JSON array to the
existing MISST lightningWebhook. MISST (LightningStrike, realtime, RadioScope, Lighting
Engine, alerts) is unchanged. This Lambda contains NO RadioScope/Lighting/alert logic.

GLM is optical total-lightning detection. It does NOT classify cloud-to-ground vs
in-cloud, and has NO polarity or peak current. Records are labeled "total_lightning"
and never "cloud-to-ground" / "ground strike".

VERIFIED SCHEMA (parsed from a real file 2026-08-08T21:03Z, OR_GLM-L2-LCFA_G19_...):
  flash_id                              int16  units "1"  (product-unique, NOT global)
  flash_lat                             float32 degrees_north  (real, not packed)
  flash_lon                             float32 degrees_east   (real, not packed)
  flash_area                            int16 packed -> m2  (scale_factor + add_offset)
  flash_energy                          int16 packed -> J   (scale_factor + add_offset)
  flash_quality_flag                    int16  units "1"
  flash_time_offset_of_first_event      int16 packed -> seconds since <window start>
  flash_time_offset_of_last_event       int16 packed -> seconds since <window start>
  (there is NO `flash_time_offset` variable)
Python netCDF4 auto-applies scale_factor/add_offset and masks _FillValue, so reads
return real m2 / J / seconds directly. Time is computed via netCDF4.num2date against
the variable's own units string (authoritative, not assumed from the filename).

provider_strike_id = "glm-<file_s_token>-<flash_id>"  (flash_id is product-unique per
20-second file, so the file's start timestamp makes the id globally unique -> the
MISST webhook dedupe is correct across files and across SNS retries).

Env vars:
  MISST_WEBHOOK_URL        required  https://<app>/functions/lightningWebhook
  LIGHTNING_WEBHOOK_SECRET required  shared secret (sent as x-lightning-webhook-secret)
  LIGHTNING_BBOX           optional  "minLat,minLon,maxLat,maxLon" (default South Florida)
  GLM_BUCKET               optional  default noaa-goes19
  GLM_PRODUCT              optional  default GLM-L2-LCFA
  IDEMPOTENCY_TABLE        optional  DynamoDB table for file-level idempotency
"""
import json
import os
import time
import urllib.request
import urllib.error
import urllib.parse
from datetime import timezone

import numpy as np
import boto3
from botocore import UNSIGNED
from botocore.config import Config

try:
    from netCDF4 import Dataset, num2date
except Exception as e:  # netCDF4/HDF5 not available in this image
    Dataset = None
    num2date = None
    _NETCDF_IMPORT_ERROR = e

WEBHOOK_URL = os.environ.get("MISST_WEBHOOK_URL", "")
WEBHOOK_SECRET = os.environ.get("LIGHTNING_WEBHOOK_SECRET", "")
BBOX = os.environ.get("LIGHTNING_BBOX", "24.0,-83.0,31.0,-78.0")
BUCKET = os.environ.get("GLM_BUCKET", "noaa-goes19")
PRODUCT = os.environ.get("GLM_PRODUCT", "GLM-L2-LCFA")
IDEMPOTENCY_TABLE = os.environ.get("IDEMPOTENCY_TABLE", "")
MAX_FLASHES_PER_POST = 500

_dynamo = boto3.resource("dynamodb") if IDEMPOTENCY_TABLE else None


def parse_bbox(s):
    try:
        return tuple(float(x) for x in s.split(","))
    except Exception:
        return (24.0, -83.0, 31.0, -78.0)


def in_bbox(lat, lon, bbox):
    min_lat, min_lon, max_lat, max_lon = bbox
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def already_seen(object_key):
    if not _dynamo:
        return False
    try:
        return bool(_dynamo.Table(IDEMPOTENCY_TABLE).get_item(Key={"object_key": object_key}).get("Item"))
    except Exception:
        return False


def mark_seen(object_key):
    if not _dynamo:
        return
    try:
        _dynamo.Table(IDEMPOTENCY_TABLE).put_item(
            Item={"object_key": object_key, "ttl": int(time.time()) + 604800}
        )
    except Exception:
        pass


def s_token_from_key(key):
    """Filename s-token (YYYYJJJHHMMSSss) — unique per 20-second product file."""
    try:
        return key.split("/")[-1].split("_s")[1].split("_e")[0]
    except Exception:
        return None


def download_netcdf(bucket, key):
    s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED), region_name="us-east-1")
    tmp = f"/tmp/{key.split('/')[-1]}"
    s3.download_file(bucket, key, tmp)
    return tmp


def _unmask(x):
    """netCDF4 returns masked values for _FillValue; return None for those, else float."""
    try:
        if np.ma.is_masked(x):
            return None
    except Exception:
        pass
    try:
        return float(x)
    except Exception:
        return None


def _to_utc_iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)  # GLM times are UTC
    return dt.isoformat().replace("+00:00", "Z")


def extract_flashes(nc_path, bbox, s_token):
    """Extract in-bbox flash records using the VERIFIED variable names. netCDF4
    auto-applies scale_factor/add_offset and masks _FillValue, so area/energy/time
    read as real m2 / J / seconds. Flash time = flash_time_offset_of_first_event,
    converted to absolute UTC via num2date against the variable's own units string."""
    ds = Dataset(nc_path, "r")
    try:
        v = ds.variables
        flash_id = v["flash_id"][:]
        flash_lat = v["flash_lat"][:]
        flash_lon = v["flash_lon"][:]
        flash_area = v["flash_area"][:]
        flash_energy = v["flash_energy"][:]
        flash_quality = v["flash_quality_flag"][:]
        t_first_var = v["flash_time_offset_of_first_event"]
        t_last_var = v["flash_time_offset_of_last_event"]
        t_first = num2date(t_first_var[:], t_first_var.units, calendar="standard")
        t_last = num2date(t_last_var[:], t_last_var.units, calendar="standard")
        n = len(flash_id)
        out = []
        for i in range(n):
            lat = float(flash_lat[i])
            lon = float(flash_lon[i])
            if not in_bbox(lat, lon, bbox):
                continue
            # skip if the flash time itself is a fill value
            if np.ma.is_masked(t_first_var[i]):
                continue
            fid = int(flash_id[i])
            t0 = _to_utc_iso(t_first[i])
            dur = None
            try:
                if not np.ma.is_masked(t_last_var[i]):
                    a = t_first[i].replace(tzinfo=timezone.utc) if t_first[i].tzinfo is None else t_first[i]
                    b = t_last[i].replace(tzinfo=timezone.utc) if t_last[i].tzinfo is None else t_last[i]
                    dur = (b - a).total_seconds()
            except Exception:
                dur = None
            area = _unmask(flash_area[i])
            energy = _unmask(flash_energy[i])
            quality = None if np.ma.is_masked(flash_quality[i]) else int(flash_quality[i])
            sid = f"glm-{s_token}-{fid}" if s_token else f"glm-{fid}"
            out.append({
                "provider": "noaa_glm",
                "id": sid,
                "latitude": lat,
                "longitude": lon,
                "time": t0,
                "intensity": energy,
                "type": "total_lightning",
                "metadata": {
                    "source": "NOAA GOES-19 GLM",
                    "flash_id": fid,
                    "flash_area": area,
                    "flash_duration": dur,
                    "quality": quality,
                    "radiant_energy": energy,
                },
            })
            if len(out) >= MAX_FLASHES_PER_POST:
                break
        return out, {
            "count": len(out),
            "total": n,
            "time_units": t_first_var.units,
            "s_token": s_token,
        }
    finally:
        ds.close()


def post_to_misst(records):
    if not WEBHOOK_URL or not WEBHOOK_SECRET:
        return {"error": "webhook url/secret not configured"}
    body = json.dumps({"provider": "noaa_glm", "strikes": records}).encode()
    req = urllib.request.Request(WEBHOOK_URL, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-lightning-webhook-secret", WEBHOOK_SECRET)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return {"status": resp.status, "ms": int((time.time() - t0) * 1000), "body": resp.read().decode()[:500]}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "error": e.read().decode()[:500]}
    except Exception as e:
        return {"error": str(e)}


def handler(event, context):
    bbox = parse_bbox(BBOX)
    results = []
    for rec in event.get("Records", []):
        try:
            msg = json.loads(rec["Sns"]["Message"])
        except Exception:
            results.append({"error": "invalid SNS message"})
            continue
        for r in msg.get("Records", []):
            s3 = r.get("s3", {})
            bucket = s3.get("bucket", {}).get("name", BUCKET)
            key = urllib.parse.unquote_plus(s3.get("object", {}).get("key", ""))
            if not key.startswith(PRODUCT):
                results.append({"skip": key, "reason": "not GLM-L2-LCFA"})
                continue
            if already_seen(key):
                results.append({"skip": key, "reason": "already processed"})
                continue
            t_invoke = time.time()
            try:
                if Dataset is None:
                    raise _NETCDF_IMPORT_ERROR
                nc_path = download_netcdf(bucket, key)
                s_token = s_token_from_key(key)
                flashes, info = extract_flashes(nc_path, bbox, s_token)
                if not flashes:
                    results.append({"key": key, "flashes": 0, "info": info})
                    continue
                post = post_to_misst(flashes)
                mark_seen(key)
                results.append({
                    "key": key,
                    "flashes": len(flashes),
                    "post": post,
                    "info": info,
                    "ms_total": int((time.time() - t_invoke) * 1000),
                })
            except Exception as e:
                # fail safe: log, do not fabricate strikes, do not delete anything
                results.append({"key": key, "error": str(e)})
    return {"ok": True, "results": results}