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
    development: {
      ignore: [/__tests__/],
    },
  },
};
