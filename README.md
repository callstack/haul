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

then, create `webpack.config.js` in your root folder:

```js
module.exports = ({ platform }) => ({
  entry: `./index.${platform}.js`,
});
```

It's a function that returns config based on the platform. If you plan to overwrite other
Wepback properties, like `module` or `resolve`, you can access default values:

```js
module.exports = ({ platform, module, resolve }) => ({
  entry: `./index.${platform}.js`,
});
```

<h2 align="center">Motiviation</h2>

todo mike
