# Recipes

## Typescript
You will need to install `ts-loader` for Haul to work with TypeScript.

```yarn add -D ts-loader```

This is a `webpack.haul.js` that works with TypeScript.
```javascript
module.exports = ({ platform }, { module, resolve }) => ({
  entry: `./src/index.${platform}.tsx`,
  module: {
    ...module,
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      ...module.rules
    ]
  },
  resolve: {
    ...resolve,
    extensions: [
      '.ts',
      '.tsx',
      `.${platform}.ts`,
      '.native.ts',
      `.${platform}.tsx`,
      '.native.tsx',
      ...resolve.extensions
    ]
  }
});
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

```yarn add -D babel-loader```

Revised `webpack.haul.js`

```javascript
module.exports = ({ platform }, { module, resolve }) => ({
  entry: `./src/index.${platform}.tsx`,
  module: {
    ...module,
    rules: [
      {
        test: /\.tsx?$/,
        exclude: '/node_modules/',
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader'
          },
        ],
      },
      ...module.rules
    ]
  },
  resolve: {
    ...resolve,
    extensions: [
      '.ts',
      '.tsx',
      `.${platform}.ts`,
      '.native.ts',
      `.${platform}.tsx`,
      '.native.tsx',
      ...resolve.extensions],
  },
});
```
