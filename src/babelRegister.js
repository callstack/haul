/**
 * Babel config is stored in `package.json` so that
 * Jest can read it.
 */
const babelConfig = require('../package.json').babel;

function resolve(presetsOrPlugins) {
  return presetsOrPlugins.map(item => {
    return typeof item === 'string'
      ? require.resolve(item)
      : [require.resolve(item[0]), item[1]];
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
require('@babel/register')(
  Object.assign(
    {
      ignore: [/node_modules(?!\/haul)/],
      retainLines: true,
      sourceMaps: 'inline',
      babelrc: false,
    },
    babelConfig,
    {
      presets: resolve(babelConfig.presets),
      plugins: resolve(babelConfig.plugins),
    }
  )
);
