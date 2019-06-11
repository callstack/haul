import { NormalizedProjectConfigBuilder } from './types';

export default function getNormalizedProjectConfigBuilder(
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
    config = require(configPath);
    config = config.__esModule ? config.default : config;
  }

  return config as NormalizedProjectConfigBuilder;
}