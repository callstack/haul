module.exports = {
  presets: [['module:../../packages/haul-babel-preset-react-native', { chackra: true }]],
  overrides: [
    {
      test: /__tests__/,
      plugins: [['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }]]
    }
  ]
};
