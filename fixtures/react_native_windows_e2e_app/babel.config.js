module.exports = {
  // Use Metro Babel preset. ChackraCore do not support all syntaxes produced by Haul's Babel preset.
  presets: ['module:metro-react-native-babel-preset'],
  // overrides: [
  //   {
  //     test: /__tests__/,
  //     plugins: [['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }]]
  //   }
  // ]
};
