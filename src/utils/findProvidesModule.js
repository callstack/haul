const fs = require('fs');

/**
 * Recursively crawles given directories and builds a map
 * of provided modules along with their absolute path.
 */
function findProvidesModule(directories, opts = {}) {
  const options = Object.assign(opts, defaultOpts);

  return {};
}

const defaultOpts = {
  blacklist: [
    /node_modules/
  ],
};

module.exports = findProvidesModule;