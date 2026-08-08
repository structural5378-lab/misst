"""
MISST NOAA GOES-19 GLM L2 LCFA -> lightningWebhook relay (data adapter ONLY).

Receives NewGOES19Object SNS notifications, downloads GLM L2 LCFA NetCDF4 files,
extracts flash records, filters to a configurable bbox, and POSTs a JSON array to the
existing MISST lightningWebhook. MISST (LightningStrike, realtime, RadioScope, Lighting
Engine, alerts) is unchanged. This Lambda contains NO RadioScope/Lighting/alert logic.

GLM is optical total-lightning detection. It does NOT classify cloud-to-ground vs
in-cloud, and has NO polarity or peak current. Records are labeled "total_lightning"
and never "cloud-to-ground" / "ground strike".

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
from datetime import datetime, timezone, timedelta

import boto3
from botocore import UNSIGNED
from botocore.config import Config

try:
    from netCDF4 import Dataset
except Exception as e:  # netCDF4/HDF5 not available in this image
    Dataset = None
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


def window_start_from_key(key):
    """OR_GLM-L2-LCFA_G19_sYYYYJJJHHMMSSss_... -> UTC datetime (20s window start)."""
    try:
        s = key.split("/")[-1].split("_s")[1].split("_e")[0]
        year, doy = int(s[0:4]), int(s[4:7])
        hh, mm, ss, cs = int(s[7:9]), int(s[9:11]), int(s[11:13]), int(s[13:15])
        return datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(
            days=doy - 1, hours=hh, minutes=mm, seconds=ss, milliseconds=cs * 10
        )
    except Exception:
        return None


def download_netcdf(bucket, key):
    s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED), region_name="us-east-1")
    tmp = f"/tmp/{key.split('/')[-1]}"
    s3.download_file(bucket, key, tmp)
    return tmp


def extract_flashes(nc_path, bbox, window_start):
    """Extract in-bbox flash records. Variable names follow the GOES-R GLM L2 LCFA
    Product Definition; run self_test.py against a real file to confirm before relying
    on them."""
    ds = Dataset(nc_path, "r")
    try:
        v = ds.variables
        flash_id = v.get("flash_id")
        flash_lat = v.get("flash_lat")
        flash_lon = v.get("flash_lon")
        flash_time = v.get("flash_time_offset") or v.get("flash_time")
        flash_area = v.get("flash_area")
        flash_energy = v.get("flash_energy")
        flash_quality = v.get("flash_quality_flag")
        t_first = v.get("flash_time_offset_of_first_event")
        t_last = v.get("flash_time_offset_of_last_event")
        if flash_id is None or flash_lat is None or flash_lon is None:
            return [], {"error": "missing core flash variables", "variables": list(v.keys())}
        n = len(flash_id)
        out = []
        for i in range(n):
            lat = float(flash_lat[i])
            lon = float(flash_lon[i])
            if not in_bbox(lat, lon, bbox):
                continue
            fid = int(flash_id[i])
            t_off = float(flash_time[i]) if flash_time is not None else 0.0
            if window_start:
                iso = (window_start + timedelta(seconds=t_off)).isoformat().replace("+00:00", "Z")
            else:
                iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            dur = None
            if t_first is not None and t_last is not None:
                try:
                    dur = float(t_last[i]) - float(t_first[i])
                except Exception:
                    dur = None
            area = float(flash_area[i]) if flash_area is not None else None
            energy = float(flash_energy[i]) if flash_energy is not None else None
            quality = int(flash_quality[i]) if flash_quality is not None else None
            out.append({
                "provider": "noaa_glm",
                "id": f"glm-{fid}",
                "latitude": lat,
                "longitude": lon,
                "time": iso,
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
        return out, {"count": len(out), "total": n, "variables": list(v.keys())[:50]}
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
                window_start = window_start_from_key(key)
                flashes, info = extract_flashes(nc_path, bbox, window_start)
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