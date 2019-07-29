const path = require('path');

module.exports = {
  displayName: 'integration-react-native-0.60x-multibundle',
  setupFilesAfterEnv: [
    path.join(__dirname, '../../jest/setupTestFramework.js'),
  ],
  testRegex: '/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
};
