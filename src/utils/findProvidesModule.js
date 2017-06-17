/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * findProvidesModule.js
 */
const fs = require('fs');
const path = require('path');

const defaultOpts = {
  // An array of folders to ignore when building map of modules
  // within given directory
  blacklist: [
    'node_modules',
    '__tests__',
    '__mocks__',
    '__fixtures__',
    'react-packager',
    'androidTest',
  ],
  // An array of platform extensions to look for when locating
  // modules
  platforms: ['ios', 'android', 'native', 'web'],
};

/**
 * Returns Javascript file name or null for others
 */
const getJSFileName = fileName => {
  return (/^(.*)\.js$/.exec(fileName) || [])[1];
};

/**
 * Returns file name without platform extension (if present)
 */
const getPlatformFileName = (fileName, platforms) => {
  // eslint-disable-next-line no-unused-vars
  const [_, realName, extension] = /^(.*)\.(\w+)$/.exec(fileName) || [];
  return platforms.indexOf(extension) >= 0 ? realName : fileName;
};

/**
 * Returns name of the module provided by given file (if present)
 */
const getProvidedModuleName = fileName => {
  const content = fs.readFileSync(fileName, 'utf-8');
  return (/\* @providesModule ([\w.-]+)/.exec(content) || [])[1];
};

/**
 * Recursively loops over given directories and returns a map of all
 * haste modules
 */
function findProvidesModule(directories, opts = {}) {
  const options = Object.assign({}, defaultOpts, opts);

  const modulesMap = {};

  const walk = dir => {
    const stat = fs.lstatSync(dir);

    if (stat.isDirectory()) {
      fs.readdirSync(dir).forEach(file => {
        if (options.blacklist.indexOf(file) >= 0) {
          return;
        }
        walk(path.join(dir, file));
      });
      return;
    }

    if (stat.isFile()) {
      const jsFileName = getJSFileName(dir);
      if (!jsFileName) {
        return;
      }

      const fileName = getPlatformFileName(jsFileName, options.platforms);

      const moduleName = getProvidedModuleName(dir);
      if (!moduleName) {
        return;
      }

      // Throw when duplicated modules are provided from a different
      // fileName
      if (modulesMap[moduleName] && modulesMap[moduleName] !== fileName) {
        throw new Error('Duplicate haste module found');
      }
      modulesMap[moduleName] = fileName;
    }
  };

  directories.forEach(walk);

  return modulesMap;
}

module.exports = findProvidesModule;
