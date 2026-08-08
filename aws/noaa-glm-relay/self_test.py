"""
TEST 1 helper: download ONE real current GLM L2 LCFA file, print variables, units,
global attributes, and the first flash record (unpacked). Run locally before relying
on the parser.

    pip install netCDF4 boto3 botocore numpy
    python3 self_test.py

PASS = valid NetCDF4 + flash_id/flash_lat/flash_lon/flash_time_offset_of_first_event
present + a real flash with latitude, longitude, absolute timestamp, and (where
present) unpacked energy/area.
"""
import datetime

import boto3
import numpy as np
from botocore import UNSIGNED
from botocore.config import Config
from netCDF4 import Dataset, num2date

BUCKET = "noaa-goes19"
PRODUCT = "GLM-L2-LCFA"

s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED), region_name="us-east-1")
now = datetime.datetime.now(datetime.timezone.utc)
doy = now.timetuple().tm_yday
prefix = f"{PRODUCT}/{now.year}/{doy:03d}/{now.hour:02d}/"
objs = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix).get("Contents", [])
if not objs:
    prev = now - datetime.timedelta(hours=1)
    prefix = f"{PRODUCT}/{prev.year}/{prev.timetuple().tm_yday:03d}/{prev.hour:02d}/"
    objs = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix).get("Contents", [])
if not objs:
    print("No GLM L2 LCFA files found at", prefix)
    raise SystemExit(1)

key = objs[-1]["Key"]
print("Latest file:", key)
tmp = f"/tmp/{key.split('/')[-1]}"
s3.download_file(BUCKET, key, tmp)

ds = Dataset(tmp, "r")
print("\nGlobal attributes:")
for a in ("time_coverage_start", "time_coverage_end", "instrument_ID", "orbital_slot",
          "platform_ID", "title", "Conventions"):
    try:
        print(f"  {a} = {ds.getncattr(a)}")
    except Exception:
        pass

print("\nAll variables:", list(ds.variables.keys()))

expected = ["flash_id", "flash_lat", "flash_lon", "flash_area", "flash_energy",
            "flash_quality_flag", "flash_time_offset_of_first_event",
            "flash_time_offset_of_last_event", "product_time"]
print("\nVariable presence + units:")
for name in expected:
    if name in ds.variables:
        var = ds.variables[name]
        units = getattr(var, "units", "?")
        print(f"  {name}: PRESENT  units={units!r} dtype={var.dtype}")
    else:
        print(f"  {name}: MISSING")

fid = ds.variables.get("flash_id")
if fid is not None and len(fid):
    i = 0
    print("\nFirst flash (unpacked — netCDF4 auto-applies scale/offset):")
    print(f"  flash_id        = {int(fid[i])}")
    print(f"  flash_lat       = {float(ds.variables['flash_lat'][i])} degrees_north")
    print(f"  flash_lon       = {float(ds.variables['flash_lon'][i])} degrees_east")
    print(f"  flash_area      = {float(ds.variables['flash_area'][i])} m2")
    print(f"  flash_energy    = {float(ds.variables['flash_energy'][i])} J")
    print(f"  flash_quality   = {int(ds.variables['flash_quality_flag'][i])}")
    tv = ds.variables["flash_time_offset_of_first_event"]
    t0 = num2date(tv[i], tv.units, calendar="standard")
    if t0.tzinfo is None:
        t0 = t0.replace(tzinfo=datetime.timezone.utc)
    print(f"  flash_time(first)= {t0.isoformat()}  (units: {tv.units})")
    tv2 = ds.variables["flash_time_offset_of_last_event"]
    t1 = num2date(tv2[i], tv2.units, calendar="standard")
    if t1.tzinfo is None:
        t1 = t1.replace(tzinfo=datetime.timezone.utc)
    print(f"  flash_time(last) = {t1.isoformat()}")
    print(f"  duration         = {(t1 - t0).total_seconds()} s")
    s_token = key.split("/")[-1].split("_s")[1].split("_e")[0]
    print(f"\n  provider_strike_id = glm-{s_token}-{int(fid[i])}")

ds.close()
print("\nIf flash_id/flash_lat/flash_lon/flash_time_offset_of_first_event are PRESENT")
print("with real values, TEST 1 PASSES.")