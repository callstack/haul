/**
 * Babel config is stored in `package.json` so that
 * Jest can read it.
 */
const babelConfig = require('../package.json').babel;

function resolveModule(moduleId, type) {
  return require.resolve(`babel-${type}-${moduleId}`);
}

function resolve(presetsOrPlugins, type) {
  return presetsOrPlugins.map(item => {
    return typeof item === 'string'
      ? resolveModule(item, type)
      : [resolveModule(item[0], type), item[1]];
  });
}

/**
 * To prevent `babel-register` from reading foreign Babel
 * configs, `babelrc` has to be set to `false` and Haul's
 * Babel config inlined into `babel-register`'s options.
 *
 * Also presets and plugins need to be resolved to
 * Haul's `node_modules` directory, otherwise Babel would
 * search from them in project's `node_modules`.
 */
require('babel-register')(
  Object.assign(
    {
      // Use a PNPM-compatible search pattern for node_modules.
      ignore: /node_modules(?!.*[/\\]haul)/,
      retainLines: true,
      sourceMaps: 'inline',
      babelrc: false,
    },
    babelConfig,
    {
      presets: resolve(babelConfig.presets, 'preset'),
      plugins: resolve(babelConfig.plugins, 'plugin'),
    }
  )
);
