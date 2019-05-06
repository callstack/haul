const path = require('path');

module.exports = {
  displayName: 'integration-tests',
  setupFilesAfterEnv: [path.join(__dirname, '../jest/setupTestFramework.js')],
  testRegex: '/__tests__/.*\\.(test|spec)\\.js?$',
};
