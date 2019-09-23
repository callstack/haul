const path = require('path');

module.exports = {
  displayName: 'e2e-react-native-0.60x',
  setupFilesAfterEnv: [
    path.join(__dirname, '../../jest/setupTestFramework.js'),
  ],
  testRegex: '/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
};
