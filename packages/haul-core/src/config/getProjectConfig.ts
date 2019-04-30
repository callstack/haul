import { ProjectConfig } from './types';

export default function getProjectConfig(configPath?: string): ProjectConfig {
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

  return config as ProjectConfig;
}
