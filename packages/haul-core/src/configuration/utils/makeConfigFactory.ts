import {
  Configuration,
  GetBaseWebpackConfig,
  ProjectConfig,
} from '../Configuration';
import { ConfigurationBuilder } from '../ConfigurationLoader';

/**
 * Legacy function that is used by presets, for backwards compatibility.
 *
 * @param getBaseWebpackConfig - Legacy function that generates base Webpack config from a preset.
 *
 * TODO: refactor this function when moving base Webpack config to core
 */
export function makeConfigFactory(getBaseWebpackConfig: GetBaseWebpackConfig) {
  return function makeConfig(
    projectConfig: ProjectConfig
  ): ConfigurationBuilder {
    return envOptions => {
      return new Configuration(projectConfig, getBaseWebpackConfig, envOptions);
    };
  };
}
