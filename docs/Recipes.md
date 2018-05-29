---
id: recipes
title: Recipes
---

## Typescript
You will need to install `ts-loader` for Haul to work with TypeScript.

```yarn add --dev ts-loader```

This is a `webpack.haul.js` that works with TypeScript.
```javascript
import { createWebpackConfig } from "haul";

export default {
  webpack: env => {
    const config = createWebpackConfig({
      entry: `./src/index.${env.platform}.tsx`,
    })(env);

    config.module.rules = [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      ...config.module.rules,
    ];

    config.resolve.extensions = [
      '.ts',
      '.tsx',
      `.${env.platform}.ts`,
      '.native.ts',
      `.${env.platform}.tsx`,
      '.native.tsx',
      ...config.resolve.extensions,
    ]

    return config;
  }
};
```

And a corresponding (example) `tsconfig.json`
```json
{
  "compilerOptions": {
    "jsx": "react",
    "target": "es2015",
    "moduleResolution": "node",
    "sourceMap": true
  },
  "exclude": [
    "node_modules"
  ]
}
```


However, if you want to use synthetic defaults imports,
aka things like `import React from 'react'` instead of `import * as React from 'react'`
you will need a little more.
Your .tsconfig.json must have `"allowSyntheticDefaultImports": true`,
and you will need to pass the code through babel.
You will need `babel-loader` for this.

```yarn add --dev babel-loader```

Revised `webpack.haul.js`

```javascript
import { createWebpackConfig } from "haul";

export default {
  webpack: env => {
    const config = createWebpackConfig({
      entry: `./src/index.${env.platform}.tsx`,
    })(env);

    config.module.rules = [
      {
        test: /\.tsx?$/,
        exclude: '/node_modules/',
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
          }
        ]
      },
      ...config.module.rules,
    ];

    config.resolve.extensions = [
      '.ts',
      '.tsx',
      `.${env.platform}.ts`,
      '.native.ts',
      `.${env.platform}.tsx`,
      '.native.tsx',
      ...config.resolve.extensions,
    ]

    return config;
  }
};
```

## Mock files when running detox tests
[Detox](https://github.com/wix/detox) is a "grey box" e2e framework developed by wix.
It provides the ability to mock files during tests using [react-native-repackager](https://github.com/wix/react-native-repackager)

react-native-repackager is built for the standard react-native packager, so your mocks won't work with haul out-of-the-box. Luckily, it's easy to congiure haul (webpack, actually) to resolve the mocked files instead of the original ones during tests:


```javascript

// webpack.haul.js

resolve: {
    ...defaults.resolve,
    extensions: process.env.APP_ENV === 'detox_tests'
            ? ['.mock.behaviour.js', ...defaults.resolve.extensions]
            : defaults.resolve.extensions
  },


```

Set the environment variable `APP_ENV` to
`detox_tests` when running Haul:

```sh
APP_ENV=detox_tests yarn haul
```
