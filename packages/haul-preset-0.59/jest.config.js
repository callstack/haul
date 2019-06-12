const path = require('path');

module.exports = {
  displayName: '@haul-bundler/preset-0.59',
  testPathIgnorePatterns: ['fixtures/.*'],
  testRegex: '/__tests__/.*\\.(test|spec)\\.ts?$',
  moduleNameMapper: {
    '^jest/(.*)': path.join(__dirname, '../../jest/$1'),
  },
};
