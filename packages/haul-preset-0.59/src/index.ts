import webpack from 'webpack';
import { injectPolyfillIntoEntry } from '@haul/core-legacy/build/utils/makeReactNativeConfig';
import getDefaultConfig, { EnvOptions } from './defaultConfig';

type WebpackConfigFactory =
  | ((options: EnvOptions) => webpack.Configuration)
  | webpack.Configuration;

export function createWebpackConfig(
  configBuilder: WebpackConfigFactory
): (options: EnvOptions) => webpack.Configuration {
  return (options: EnvOptions) => {
    const haulWebpackConfiguration =
      typeof configBuilder === 'function'
        ? configBuilder(options)
        : configBuilder;

    const defaultWebpackConfig = getDefaultConfig(options);

    /**
     * Currently we support only "entry" field in config file
     */
    const { entry } = haulWebpackConfiguration;

    const config = {
      ...defaultWebpackConfig,
      entry: injectPolyfillIntoEntry({
        root: options.root,
        initializeCoreLocation: options.initializeCoreLocation,
        entry,
        dev: options.dev,
        disableHotReloading: !options.hotReloading,
      }),
      name: options.platform,
    };

    return (config as unknown) as webpack.Configuration;
  };
}
