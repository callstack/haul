<div align="center">
 <h1>haul</h1>
  <p>
    haul is a command line interface to React Native built on Webpack, rnpm and open tooling.
  </p>
</div>

<h2 align="center">Install</h2>

```bash
npm install --save-dev haul-cli
```

then, create `webpack.config.js` in your root and specify an entry point of your app:

```js
module.exports = {
  entry: './index.js',
};
```
Typically your mobile app will have `index.ios.js` and `index.android.js` files. In such case, you can change your `webpack.config.js` to be a function:

```js
module.exports = ({ platform }) => {
  entry: `./index.${platform}.js`,
};
```
and return entry point based on platform.

If you are planning to override any of Webpack properties, like `module.loaders` or `resolve.moduleDirectories`, be sure to load defaults:
```js
module.exports = ({ platform, resolve }) => {
  entry: `./index.${platform}.js`,
  resolve: {
    ...resolve,
    moduleDirectories: ['src'],
  },
};
```
