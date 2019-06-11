import {
  createPreset,
  EnvOptions,
  HaulConfig,
  Runtime,
  injectPolyfillsIntoEntry,
} from '@haul-bundler/core';
import webpack from 'webpack';
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
      entry: injectPolyfillsIntoEntry({
        root: options.root,
        initializeCoreLocation: options.initializeCoreLocation,
        entry,
        dev: options.dev,
        hotReloading: options.hotReloading,
      }),
      name: options.platform,
    };

    return (config as unknown) as webpack.Configuration;
  };
});

export { default as withPolyfills } from './withPolyfills';
