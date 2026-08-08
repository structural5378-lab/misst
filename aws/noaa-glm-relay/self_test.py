"""
TEST 1 helper: download ONE real current GLM L2 LCFA file and print its variables +
the first flash record. Run locally before relying on the parser variable names.

    pip install netCDF4 boto3 botocore
    python3 self_test.py

PASS = valid NetCDF4 + flash_id/flash_lat/flash_lon/flash_time present + a real
flash with latitude, longitude, timestamp, and (where present) energy/area.
"""
import datetime
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from netCDF4 import Dataset

BUCKET = "noaa-goes19"
PRODUCT = "GLM-L2-LCFA"

s3 = boto3.client("s3", config=Config(signature_version=UNSIGNED), region_name="us-east-1")
now = datetime.datetime.now(datetime.timezone.utc)
doy = now.timetuple().tm_yday
prefix = f"{PRODUCT}/{now.year}/{doy:03d}/{now.hour:02d}/"
objs = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix).get("Contents", [])
if not objs:
    # fall back one hour if the current hour is empty
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
print("Global attrs:")
for a in ("time_coverage_start", "time_coverage_end", "instrument_ID", "orbital_slot", "platform_ID"):
    try:
        print("  ", a, "=", ds.getncattr(a))
    except Exception:
        pass
print("Variables:", list(ds.variables.keys()))
expected = [
    "flash_id", "flash_lat", "flash_lon", "flash_time_offset",
    "flash_time_offset_of_first_event", "flash_time_offset_of_last_event",
    "flash_area", "flash_energy", "flash_quality_flag",
]
print("\nVariable presence:")
for v in expected:
    print(f"  {v}: {'PRESENT' if v in ds.variables else 'MISSING'}")

fid = ds.variables.get("flash_id")
if fid is not None and len(fid):
    i = 0
    print("\nFirst flash:")
    for name in ["flash_id", "flash_lat", "flash_lon", "flash_area", "flash_energy", "flash_quality_flag"]:
        var = ds.variables.get(name)
        if var is not None:
            val = var[i]
            print(f"  {name} = {val}")
ds.close()
print("\nIf flash_id/flash_lat/flash_lon are PRESENT with real values, TEST 1 PASSES.")