const path = require('path');

module.exports = {
  displayName: '@haul-bundler/core',
  testPathIgnorePatterns: ['__fixtures__/.*'],
  testRegex: '/__tests__/.*\\.(test|spec)\\.(j|t)sx?$',
  moduleNameMapper: {
    '^jest/(.*)': path.join(__dirname, '../../jest/$1'),
  },
  testEnvironment: 'node',
};
