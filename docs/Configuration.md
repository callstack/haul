# Configuration

The `webpack.haul.js` file is a webpack configuration used by `Haul`. The simplest config looks like this:

```js
module.exports = {
  entry: './index.js',
};
```

This works when you have a single `index.js` as the entry point. But when you have more than one entry point like `index.android.js` and `index.ios.js`, or you want to customize the webpack configuration, you can export a function instead of a plain object.

The function will receive options as the first parameter, and the configuration used by `Haul` as the second parameter.

Options is an object with the following shape:

```js
type Options = {
  platform: 'ios' | 'android', // Current platform
  dev: boolean, // Whether to build for development
  minify: boolean, // Whether to minify the bundle
  bundle: boolean, // Whether building the bundle for packaging
  root: string, // Absolute path to the project root
}
```

You should return the final configuration object to be used by `Haul` based on the arguments.

For example, to configure your entry point according to the platform, you can do the following:

```js
module.exports = ({ platform }) => ({
  entry: `./index.${platform}.js`,
});
```

If you are want to customize the webpack configuration, like `loaders` etc., define them as usual, and merge the passed configuration in:

```js
module.exports = ({ platform }, defaults) => ({
  entry: `./index.${platform}.js`,
  module: {
    ...defaults.module,
    rules: {
      ...defaults.module.rules,
      {
        test: /\.js$/,
        use: 'custom-loader',
      }
    },
  },
  resolve: {
    ...defaults.resolve,
    plugins: [...defaults.resolve.plugins, new CustomPlugin()],
    modules: ['src'],
  },
});
```

See the [Webpack website](https://webpack.js.org/) to learn more about configuring Webpack.
