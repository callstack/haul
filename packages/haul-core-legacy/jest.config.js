const path = require('path');

module.exports = {
  setupFilesAfterEnv: [path.join(__dirname, '/jest/setupTestFramework.js')],
  testPathIgnorePatterns: [
    path.join(__dirname, '/integration_tests/.*/__tests__'),
  ],
  moduleNameMapper: {
    '^jest/(.*)': path.join(__dirname, 'jest/$1'),
  },
  testMatch: ['**/*.test.js'],
};
