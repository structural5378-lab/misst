# Container image for the MISST NOAA GLM relay Lambda.
# netCDF4 manylinux wheels bundle HDF5/libnetcdf, so no system packages needed.
# Build & push:
#   aws ecr create-repository --repository-name misst-noaa-glm-relay --region us-east-1
#   docker build -t misst-noaa-glm-relay .
#   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <acct>.dkr.ecr.us-east-1.amazonaws.com
#   docker tag misst-noaa-glm-relay:latest <acct>.dkr.ecr.us-east-1.amazonaws.com/misst-noaa-glm-relay:latest
#   docker push <acct>.dkr.ecr.us-east-1.amazonaws.com/misst-noaa-glm-relay:latest
FROM public.ecr.aws/lambda/python:3.12

RUN pip install --no-cache-dir netCDF4 requests boto3

COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_function.handler"]