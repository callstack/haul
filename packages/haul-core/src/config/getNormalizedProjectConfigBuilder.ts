import { NormalizedProjectConfigBuilder } from './types';
import importModule from '../utils/importModule';
import Runtime from '../runtime/Runtime';

export default function getNormalizedProjectConfigBuilder(
  runtime: Runtime,
  configPath?: string
): NormalizedProjectConfigBuilder {
  let config;

  /**
   * When it doesn't have DEFAULT_CONFIG_FILENAME and it's not specified another file
   * we will use default configuration based on main file from package.json
   */
  if (!configPath) {
    throw new Error("Couldn't find `haul.config.js`");
  } else {
    config = importModule(configPath, { resolve: require.resolve, runtime })
      .exports;
    config = config.__esModule ? config.default : config;
  }

  if (typeof config !== 'function') {
    throw new Error(
      `Exported value from ${configPath} does not seem to be a valid Haul config - did you forget to use "makeConfig"?`
    );
  }

  return config as NormalizedProjectConfigBuilder;
}
