import makeConfig from '../makeConfig';
import withPolyfills from '../withPolyfills';
import { Runtime, ProjectConfig, EnvOptions } from '@haul-bundler/core';

function hasPlugin(webpackConfig: any, pluginName: string) {
  return webpackConfig.plugins.some(
    (p: any) => p.constructor.name === pluginName
  );
}

describe('makeConfig', () => {
  describe('with single bundle', () => {
    it('should create config for basic-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: withPolyfills('index.js'),
          },
        },
      };
      const runtime = new Runtime();
      const env: EnvOptions = {
        platform: 'ios',
        root: __dirname,
        dev: true,
        bundle: true,
        bundleType: 'basic-bundle',
        singleBundleMode: true,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(config).toMatchSnapshot();
    });

    it('should create config for indexed-ram-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            type: 'indexed-ram-bundle',
            entry: withPolyfills('index.js'),
          },
        },
      };
      const runtime = new Runtime();
      const env: EnvOptions = {
        platform: 'ios',
        root: __dirname,
        dev: true,
        bundle: true,
        bundleType: 'basic-bundle',
        singleBundleMode: true,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
      expect(config).toMatchSnapshot();
    });

    it('should create config for file-ram-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            type: 'file-ram-bundle',
            entry: withPolyfills('index.js'),
          },
        },
      };
      const runtime = new Runtime();
      const env: EnvOptions = {
        platform: 'ios',
        root: __dirname,
        dev: true,
        bundle: true,
        bundleType: 'basic-bundle',
        singleBundleMode: true,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
      expect(config).toMatchSnapshot();
    });
  });

  it('should create config with external source maps', () => {
    const projectConfig: ProjectConfig = {
      bundles: {
        index: {
          sourceMap: true,
          entry: withPolyfills('index.js'),
        },
      },
    };
    const runtime = new Runtime();
    const env: EnvOptions = {
      platform: 'ios',
      root: __dirname,
      dev: true,
      bundleType: 'basic-bundle',
      singleBundleMode: true,
    };
    let config = makeConfig(projectConfig)(runtime, env);
    expect(
      hasPlugin(config.webpackConfigs.index, 'SourceMapDevToolPlugin')
    ).toBeTruthy();

    config = makeConfig(projectConfig)(runtime, {
      ...env,
      dev: false,
    });
    expect(
      hasPlugin(config.webpackConfigs.index, 'SourceMapDevToolPlugin')
    ).toBeTruthy();
  });

  it('should create config with inline source maps', () => {
    const projectConfig: ProjectConfig = {
      bundles: {
        index: {
          sourceMap: 'inline',
          entry: withPolyfills('index.js'),
        },
      },
    };
    const runtime = new Runtime();
    const env: EnvOptions = {
      platform: 'ios',
      root: __dirname,
      dev: true,
      bundleType: 'basic-bundle',
      singleBundleMode: true,
    };
    const config = makeConfig(projectConfig)(runtime, env);
    expect(
      hasPlugin(config.webpackConfigs.index, 'EvalSourceMapDevToolPlugin')
    ).toBeTruthy();
  });

  it('should create config for packager server', () => {
    const projectConfig: ProjectConfig = {
      bundles: {
        index: {
          entry: withPolyfills('index.js'),
        },
      },
    };
    const runtime = new Runtime();
    const env: EnvOptions = {
      platform: 'ios',
      root: __dirname,
      dev: true,
      bundleType: 'basic-bundle',
      singleBundleMode: true,
    };
    const config = makeConfig(projectConfig)(runtime, env);
    expect(
      hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
    ).toBeFalsy();
    expect(
      hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
    ).toBeFalsy();
  });
});
