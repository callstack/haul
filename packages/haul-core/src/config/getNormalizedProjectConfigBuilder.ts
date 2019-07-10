import { NormalizedProjectConfigBuilder } from './types';

export default function getNormalizedProjectConfigBuilder(
  configPath?: string
): NormalizedProjectConfigBuilder {
  // TODO: figure out a better way to read and transpile user files on-demand
  require('@haul-bundler/core-legacy/build/babelRegister');

  let config;

  /**
   * When it doesn't have DEFAULT_CONFIG_FILENAME and it's not specified another file
   * we will use default configuration based on main file from package.json
   */
  if (!configPath) {
    throw new Error("Couldn't find `haul.config.js`");
  } else {
    config = require(configPath);
    config = config.__esModule ? config.default : config;
  }

  if (typeof config !== 'function') {
    throw new Error(
      `Exported value from ${configPath} does not seem to be a valid Haul config - did you forget to use "makeConfig"?`
    );
  }

  return config as NormalizedProjectConfigBuilder;
}
