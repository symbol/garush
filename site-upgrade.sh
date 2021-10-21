#!/usr/bin/env bash
set -e

cd packages/storage
npm run build
cd ../..
cd packages/site
npm run build
aws s3 sync build  s3://site.garush.dev --acl public-read
cd ../..
