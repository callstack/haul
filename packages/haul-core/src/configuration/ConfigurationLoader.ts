import path from 'path';
import { DEFAULT_CONFIG_FILENAME } from '../constants';
import Runtime from '../runtime/Runtime';
import { Configuration } from './Configuration';
import { EnvOptions } from '../types';
import importModule from '../utils/importModule';

export type ConfigurationBuilder = (envOptions: EnvOptions) => Configuration;

export class ConfigurationLoader {
  constructor(
    private runtime: Runtime,
    private root: string,
    private customPath?: string
  ) {}

  getConfigPath() {
    return this.customPath
      ? path.isAbsolute(this.customPath)
        ? this.customPath
        : path.join(this.root, this.customPath)
      : path.join(this.root, DEFAULT_CONFIG_FILENAME);
  }

  loadBuilder(): ConfigurationBuilder {
    let configBuilder;

    /**
     * When it doesn't have DEFAULT_CONFIG_FILENAME and it's not specified another file
     * we will use default configuration based on main file from package.json
     */
    const configPath = this.getConfigPath();

    if (!configPath) {
      throw new Error("Couldn't find `haul.config.js`");
    } else {
      configBuilder = importModule(configPath, {
        resolve: require.resolve,
        runtime: this.runtime,
      }).exports;
      configBuilder = configBuilder.__esModule
        ? configBuilder.default
        : configBuilder;
    }

    if (typeof configBuilder !== 'function') {
      throw new Error(
        `Exported value from ${configPath} does not seem to be a valid Haul config - did you forget to use "makeConfig"?`
      );
    }

    return configBuilder;
  }

  load(envOptions: EnvOptions): Configuration {
    return this.loadBuilder()(envOptions);
  }
}
