const path = require('path');

module.exports = {
  rootDir: __dirname,
  projects: [
    '<rootDir>/packages/haul-ram-bundle-webpack-plugin',
    '<rootDir>/packages/haul-basic-bundle-webpack-plugin',
    '<rootDir>/packages/haul-core',
    '<rootDir>/packages/haul-cli',
    '<rootDir>/packages/haul-preset-0.60',
    '<rootDir>/packages/haul-preset-0.59',
    '<rootDir>/packages/haul-babel-preset-react-native',
    '<rootDir>/e2e/monorepo_multibundle',
    '<rootDir>/e2e/react_native_0_60x_multibundle',
    '<rootDir>/e2e/react_native_0_60x_ts',
    '<rootDir>/e2e/react_native_0_60x',
    '<rootDir>/e2e/react_native_0_59x',
    '<rootDir>/e2e/react_native_windows_current',
    '<rootDir>/e2e/react_native_windows_vnext',
  ],
  coverageReporters: ['json'],
  coverageDirectory: path.join(__dirname, '.coverage_output'),
};
