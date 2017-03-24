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

then, create `webpack.haul.js` in your root and specify an entry point of your app:

```js
module.exports = {
  entry: './index.js',
};
```
By default, React Native app has two entry points: `index.ios.js` and `index.android.js`. In such case, you can change your `webpack.haul.js` to be a function:

```js
module.exports = ({ platform }) => ({
  entry: `./index.${platform}.js`,
});
```
and return entry point based on platform. In this example, `platform` is either `ios` or `android`, which maps to the files we have in our project.

If you are planning to override any of Webpack properties, like `module.loaders` or `resolve.modules`, be sure to load defaults:
```js
module.exports = ({ platform }, { resolve }) => {
  entry: `./index.${platform}.js`,
  resolve: {
    ...resolve,
    modules: ['src'],
  },
};
```
They are passed to function as a 2nd parameter.
