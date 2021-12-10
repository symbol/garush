#!/usr/bin/env bash
set -e

cd packages/storage
npm run build
cd ../..
cd packages/tester
npm run build
aws s3 sync build  s3://tester.garush.dev --acl public-read
cd ../..
