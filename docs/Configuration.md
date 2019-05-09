---
id: configuration
title: Configuration
---

> You can use Haul also without any configuration. If you don't have in your project file named `haul.config.js` and you don't specify custom one it will be used the default Haul configuration with entry point from you `package.json`



The `haul.config.js` file is a configuration used by `Haul`. The simplest config looks like this:

```js
import { createWebpackConfig } from "@haul/preset-0.59";

export default {
  webpack: createWebpackConfig({
    entry: `./index.js`
  })
};
```

> The `createWebpackConfig` helper function provided by Haul takes an object of settings – currently just `entry`, or function which takes an object (type Object) specified below as the first argument – it should return an object of settings as well. 

This works when you have a single `index.js` as the entry point. But when you have more than one entry point like `index.android.js` and `index.ios.js`, or you want to customize the webpack configuration, you can use a function as an argument instead of a plain object.

The function will receive options as the first parameter.

Options is an object with the following shape:

```js
type Options = {
  platform: "ios" | "android", // Current platform
  dev: boolean, // Whether to build for development
  minify: boolean, // Whether to minify the bundle
  bundle: boolean, // Whether building the bundle for packaging
  root: string // Absolute path to the project root
};
```

You should return the final configuration object to be used by `Haul` based on the arguments.

For example, to configure your entry point according to the platform, you can do the following:

```js
import { createWebpackConfig } from "@haul/preset-0.59";

export default {
  webpack: createWebpackConfig(({ platform }) => ({
    entry: `./index.${platform}.js`
  }))
};
```

If you want to customize the Webpack configuration, like `loaders` etc., you can use this approach, then you can mutate config as you want.

```js
import { createWebpackConfig } from "@haul/preset-0.59";

export default {
  webpack: (runtime, env) => {
    const config = createWebpackConfig({
      entry: './index.js',
    })(runtime, env);

    config.plugins.push(new CaseSensitivePathsPlugin());

    return config;
  }
};
```

With this approach wou can also take advantage of [webpack-merge](https://github.com/survivejs/webpack-merge). See the [Webpack website](https://webpack.js.org/) to learn more about configuring Webpack.
