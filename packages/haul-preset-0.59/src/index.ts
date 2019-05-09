import {
  createPreset,
  EnvOptions,
  HaulConfig,
  Runtime,
} from '@haul-bundler/core';
import webpack from 'webpack';
import { injectPolyfillIntoEntry } from '@haul-bundler/core-legacy/build/utils/makeReactNativeConfig';
import getDefaultConfig from './defaultConfig';

export const createWebpackConfig = createPreset((haulConfig: HaulConfig) => {
  return (runtime: Runtime, options: EnvOptions) => {
    /**
     * Currently we support only "entry" field in config file
     */
    const { entry } = haulConfig;

    const defaultWebpackConfig = getDefaultConfig(runtime, options, haulConfig);

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
});
