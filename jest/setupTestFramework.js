/* global jest */

jest.mock('chalk');

// Integration tests are quite slow to run on CI, feel free to adjust as needed
jest.setTimeout(80000);
