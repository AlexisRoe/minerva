#!/bin/bash
# LocalStack ready-hook: create the application bucket once S3 is up.
set -euo pipefail

awslocal s3 mb "s3://${S3_BUCKET}" || true
awslocal s3api put-public-access-block \
  --bucket "${S3_BUCKET}" \
  --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
echo "LocalStack: bucket ${S3_BUCKET} ready"
