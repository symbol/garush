# Garush

## Storage

To build and watch `storage` lib.
```
cd packages/storage
npm install
npm run watch
```

## Site

To build and run the `site` app.

```
cd packages/storage
npm install
npm run start
```

To create the site's static distribution 

```
cd packages/storage
npm install
npm run build
```

Then, copy the static `build` folder into the `site.garush.dev` ec2 box. 

## TODOs:
- Add CI to build and ec2 deployment
- Add lerna.

