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

  const isPlatformExtension = platforms.indexOf(extension) >= 0;

  // StaticContainer.react would be dropped if we dont count react as a valid extension
  return {
    name: isPlatformExtension ? realName : fileName,
    ignoredPlatformExtension:
      extension && !isPlatformExtension && extension !== 'react',
  };
};

/**
 * Returns name of the module provided by given file (if present)
 */
const getProvidedModuleName = fileName => {
  // The provided module is the file name (excluding OS/platform extensions)
  const segments = fileName.split(path.sep);
  return segments[segments.length - 1];
};

/**
 * Recursively loops over given directories and returns a map of all
 * haste modules
 */
function findProvidesModule(directories, opts = {}) {
  const options = Object.assign({}, defaultOpts, opts);

  const modulesMap = {};

  const walk = dir => {
    const stat = fs.statSync(dir);

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

      const { name: fileName, ignoredPlatformExtension } = getPlatformFileName(
        jsFileName,
        options.platforms
      );

      if (ignoredPlatformExtension) {
        return;
      }

      const moduleName = getProvidedModuleName(fileName);
      if (!moduleName) {
        return;
      }

      // Throw when duplicated modules are provided from a different
      // fileName
      /*
      if (modulesMap[moduleName] && modulesMap[moduleName] !== fileName) {
        throw new Error('Duplicate haste module found');
      }
      */
      modulesMap[moduleName] = fileName;
    }
  };

  directories.forEach(walk);

  return modulesMap;
}

module.exports = findProvidesModule;
