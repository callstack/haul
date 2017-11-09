/* global jest */

/**
 * Disable colours because of CI
 */
require('chalk').enabled = false;

// Integration tests are quite slow to run on CI, feel free to adjust as needed
jest.setTimeout(80000);
