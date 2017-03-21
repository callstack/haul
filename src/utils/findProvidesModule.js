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
 * Recursively loops over given directories and returns a map of all
 * haste modules 
 */
function findProvidesModule(directories, opts = {}) {
  const options = Object.assign({}, opts, defaultOpts);

  let ret = {};

  const walk = (dir) => {
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
      const fileMatch = /^(.*)\.js$/.exec(dir);
      if (!fileMatch) {
        return;
      }

      const platformMatch = /^(.*)\.(\w+)$/.exec(fileMatch[1]);
      const hasPlatformImpl = platformMatch
        && options.platforms.indexOf(platformMatch[2]) >= 0;
      
      const basePath = hasPlatformImpl ? platformMatch[1] : fileMatch[1];
      
      const moduleMatch = /\* @providesModule ([\w\.]+)/.exec(
        fs.readFileSync(dir, 'utf-8')
      );

      if (moduleMatch) {
        // Throw when duplicated modules are provided from a different 
        // basePath
        if (ret[moduleMatch[1]] && ret[moduleMatch[1]] !== basePath) {
          throw new Error('Duplicate haste module found');
        }
        ret[moduleMatch[1]] = basePath;
      }
    }
  };

  directories.forEach(walk);

  console.log(ret);

  return ret;
}

findProvidesModule(['/Users/grabbou/Repositories/HelloWorld/node_modules/react-native']);

module.exports = findProvidesModule;