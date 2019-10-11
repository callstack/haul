module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 10,
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-transform-react-jsx',
  ],
  env: {
    // Building for local development and E2E tests
    development: {
      ignore: [/__tests__/],
      plugins: ['babel-plugin-istanbul'],
    },
    // Building for publishing to NPM
    production: {
      ignore: [/__tests__/],
    },
  },
};
