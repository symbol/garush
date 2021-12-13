# Garush

## Storage

To build and watch `storage` lib.

```shell
cd packages/storage
npm install
npm run watch
```

## Tester

To build and run the `tester` app.

```shell
cd packages/tester
npm install
npm run start
```

To create the tester's static distribution 

```shell
cd packages/tester
npm install
npm run build
```

Then, copy the static `build` folder into the `s3://tester.garush.dev` static site public bucket.

To build and deploy the `tester` automatically, just run'

```shell
bash tester-upgrade.sh
```

Public tester deployment can be found in https://tester.garush.dev

## Local Development

To start all docker third party service:

```shell
docker-compose up -d
```

### Services:

The garush and third party services are:

- http://localhost:3000 - Garush Backend.
- http://localhost:3001 - Garush Frontend.
- http://localhost:3002 - Garush Tester.
- http://localhost:9001 - Minio Console. `minioadmin:minioadmin`
- http://localhost:9000 - Minio API. `minioadmin1:minioadmin1`
- localhost:5432 - Postgres DB. `admin:admin`


