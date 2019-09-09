const path = require('path');

module.exports = {
  displayName: 'integration-monorepo-multibundle',
  setupFilesAfterEnv: [
    path.join(__dirname, '../../jest/setupTestFramework.js'),
  ],
  testRegex: '/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
};
