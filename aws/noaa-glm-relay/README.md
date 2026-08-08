# MISST NOAA GOES-19 GLM Relay

External AWS Lambda that feeds **free, public** NOAA GOES-19 GLM L2 LCFA lightning
data into MISST's **existing** `lightningWebhook`. It is a data adapter only — it
contains no RadioScope, Lighting Engine, or alert logic. MISST ingestion is the
existing webhook; `LightningStrike`, the realtime pipeline, RadioScope, the Lighting
Engine, and the alert system are unchanged.

```
NOAA GOES-19 -> S3 noaa-goes19 -> NewGOES19Object SNS -> this Lambda
  -> parse GLM L2 LCFA NetCDF4 flashes
  -> filter to LIGHTNING_BBOX
  -> POST JSON to MISST lightningWebhook (x-lightning-webhook-secret)
  -> existing normalizeStrikeArray + dedupe -> LightningStrike
  -> existing realtime event -> RadioScope + Lighting Engine + alerts
```

## Why a relay (not a MISST poller)

Base44 scheduled automations have a 5-minute minimum interval, so a native MISST
poller cannot meet GLM's 20-second cadence. The SNS-triggered Lambda pushes to the
existing webhook, achieving ~20–30 s end-to-end (NOAA-dominated; not yet measured).

## Prerequisites

1. An AWS account.
2. The MISST `lightningWebhook` deployed (it is) and `LIGHTNING_WEBHOOK_SECRET` set
   in the app's secrets (it is). Get the webhook URL from
   Dashboard → Code → Functions → `lightningWebhook` (format:
   `https://<app-domain>/functions/lightningWebhook`).
3. Python 3.12+ locally to run `self_test.py` (verify the NetCDF schema).

## Step 1 — Verify the GLM NetCDF schema (TEST 1)

Before deploying, confirm the variable names against a real file:

```bash
pip install netCDF4 boto3 botocore
python3 self_test.py
```

It prints the latest file's variables, units, global attributes, and the first flash
(unpacked). The VERIFIED schema (parsed from a real 2026-08-08T21:03Z file) is:

- `flash_id` (int16, product-unique per 20s file)
- `flash_lat` / `flash_lon` (float32, degrees — real, not packed)
- `flash_area` (int16 packed → m²), `flash_energy` (int16 packed → J) — netCDF4 auto-applies scale_factor/add_offset
- `flash_quality_flag` (int16)
- `flash_time_offset_of_first_event` / `flash_time_offset_of_last_event` (int16 packed → seconds since `<window start>`)

There is **no** `flash_time_offset` variable; flash time = `flash_time_offset_of_first_event`,
converted to absolute UTC via `netCDF4.num2date` against the variable's own units string.
`provider_strike_id = glm-<file_s_token>-<flash_id>` (flash_id is product-unique, so the
file's start timestamp makes it globally unique for dedupe). If a future product version
renames any variable, update `extract_flashes()` accordingly.

## Step 2 — Build & push the container image

```bash
aws ecr create-repository --repository-name misst-noaa-glm-relay --region us-east-1
ACCT=$(aws sts get-caller-identity --query Account --output text)
docker build -t misst-noaa-glm-relay .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCT.dkr.ecr.us-east-1.amazonaws.com
docker tag misst-noaa-glm-relay:latest $ACCT.dkr.ecr.us-east-1.amazonaws.com/misst-noaa-glm-relay:latest
docker push $ACCT.dkr.ecr.us-east-1.amazonaws.com/misst-noaa-glm-relay:latest
```

## Step 3 — Deploy (SAM)

```bash
sam deploy --template-file template.yaml --stack-name misst-noaa-glm-relay \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    MisstWebhookUrl=https://YOUR-APP-DOMAIN.base44.app/functions/lightningWebhook \
    WebhookSecret=YOUR_LIGHTNING_WEBHOOK_SECRET \
    EcrImageUri=$ACCT.dkr.ecr.us-east-1.amazonaws.com/misst-noaa-glm-relay:latest
```

This creates: the Lambda (container image), a DynamoDB idempotency table (7-day TTL),
an SNS invoke permission, and the IAM role (DynamoDB + logs only). No EC2, no
always-running server.

## Step 4 — Subscribe the Lambda to the NOAA SNS topic

The NOAA Open Data SNS topic (from the AWS Open Data registry):

```
arn:aws:sns:us-east-1:123901341784:NewGOES19Object
```

Subscribe the deployed Lambda (cross-account; confirm the subscription if NOAA's
topic policy requires it):

```bash
LAMBDA_ARN=$(aws cloudformation describe-stacks --stack-name misst-noaa-glm-relay \
  --query "Stacks[0].Outputs[?OutputKey=='RelayFunctionArn'].OutputValue" --output text)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123901341784:NewGOES19Object \
  --protocol lambda \
  --notification-endpoint $LAMBDA_ARN \
  --region us-east-1
```

If cross-account subscription is rejected, request access from NOAA/NODD
(nodd@noaa.gov) or poll the S3 listing prefix on a schedule as a fallback.

## Configuration

| Env var | Required | Default | Notes |
|---|---|---|---|
| `MISST_WEBHOOK_URL` | yes | — | `https://<app>/functions/lightningWebhook` |
| `LIGHTNING_WEBHOOK_SECRET` | yes | — | matches the app secret; never expose to frontend |
| `LIGHTNING_BBOX` | no | `24.0,-83.0,31.0,-78.0` | `minLat,minLon,maxLat,maxLon` (South Florida) |
| `GLM_BUCKET` | no | `noaa-goes19` | change on a future GOES-East transition |
| `GLM_PRODUCT` | no | `GLM-L2-LCFA` | |
| `IDEMPOTENCY_TABLE` | no | — | DynamoDB table; if unset, relies on webhook dedupe |

## Idempotency & safety

- **File-level:** the DynamoDB table marks each NOAA object key as seen (7-day TTL);
  retried SNS notifications skip already-processed files.
- **Record-level:** each flash uses `provider_strike_id = glm-<file_s_token>-<flash_id>`
  (GLM `flash_id` is product-unique per 20-second file, so the file's start timestamp
  makes it globally unique); the MISST webhook dedupes by `provider_strike_id`, so even a
  double-processed file creates no duplicate `LightningStrike` records.
- **Failure:** if NOAA/S3 is unavailable, the Lambda logs and exits — it never deletes
  records or fabricates strikes. If the MISST webhook is unavailable, the POST fails
  and is logged; the next notification recovers. NetCDF parse failures log the object
  key + error and send nothing. The secret is never logged.

## Cost (development scale)

- S3 GET on a public Open Data bucket: free (AWS Open Data Sponsorship).
- SNS notifications: free (NOAA publishes).
- Lambda: ~3 invocations/min, ~1s each, 1024 MB — well within the free tier.
- DynamoDB: on-demand, a few hundred writes/day — free tier.
- Egress to MISST: tiny JSON (a few KB/min) — free.
- **Expected: ~$0/month at MISST development scale.**

## Data accuracy

GLM is **optical total-lightning** detection from geostationary orbit (~8 km nadir,
~14 km at field-of-view edge). It detects in-cloud, cloud-to-cloud, and cloud-to-ground
flashes but **cannot classify** them, and provides **no polarity or peak current**.
Records are labeled `type: "total_lightning"` and `provider: "noaa_glm"`; RadioScope
shows flash centroids, not ground-stroke points. Do not imply NLDN precision.

## Attribution

NOAA data is public (NODD): "open to the public and can be used as desired." NOAA
requests attribution; no endorsement may be implied. MISST shows
"Lightning data: NOAA GOES-R Geostationary Lightning Mapper" in RadioScope.