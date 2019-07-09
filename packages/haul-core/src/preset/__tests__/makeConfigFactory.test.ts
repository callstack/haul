import webpack from 'webpack';
import makeConfigFactory from '../makeConfigFactory';
import { Runtime, ProjectConfig, EnvOptions } from '../../';
// @ts-ignore
import { replacePathsInObject } from 'jest/helpers'; // eslint-disable-line

const makeConfig = makeConfigFactory(
  (_runtime, env, bundleName, projectConfig) => ({
    mode: env.dev ? 'development' : 'production',
    context: env.root,
    devtool: false,
    entry: projectConfig.bundles[bundleName].entry,
    target: 'webworker',
    output: {
      path: env.assetsDest || env.root,
      publicPath: `http://${projectConfig.server.host}:${
        projectConfig.server.port
      }/`,
      globalObject: 'this',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: env.dev ? '"development"' : '"production"',
        },
        __DEV__: env.dev,
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: !!env.minify,
        debug: env.dev,
      }),
    ],
  })
);

function hasPlugin(webpackConfig: any, pluginName: string) {
  return webpackConfig.plugins.some(
    (p: any) => p.constructor.name === pluginName
  );
}

const runtime = new Runtime();

describe('makeConfig', () => {
  describe('with single bundle', () => {
    const baseEnv = {
      platform: 'ios',
      root: __dirname,
      dev: false,
      singleBundleMode: true,
    };

    it('should create config for basic-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: 'index.js',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'basic-bundle',
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(replacePathsInObject(config)).toMatchSnapshot();
    });

    it('should create config with multiple entry files', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: ['./a.js', './b.js'],
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'basic-bundle',
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(config.webpackConfigs.index.entry).toEqual(['./a.js', './b.js']);
    });

    it('should create config with builder function and custom transform', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: (env, runtime) => {
            expect(env.bundleType).toEqual('basic-bundle');
            expect(runtime).toBeDefined();

            return {
              entry: 'index.js',
              transform({ bundleName, config, runtime, env }) {
                expect(bundleName).toEqual('index');
                expect(runtime).toBeDefined();
                expect(env).toBeDefined();

                config.stats = 'minimal';
              },
            };
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'basic-bundle',
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(config.webpackConfigs.index.stats).toEqual('minimal');
    });

    it('should create config for indexed-ram-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: 'index.js',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'indexed-ram-bundle',
        bundle: true,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
    });

    it('should create config for file-ram-bundle', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: 'index.js',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'file-ram-bundle',
        bundle: true,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
    });

    it('should not create config with external source maps if sourceMap=false', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            sourceMap: false,
            entry: 'index.js',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'SourceMapDevToolPlugin')
      ).toBeFalsy();
    });

    it('should create config with inline source maps if sourceMap="inline"', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            sourceMap: 'inline',
            entry: 'index.js',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
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
            entry: 'index.js',
          },
        },
      };
      const runtime = new Runtime();
      const env: EnvOptions = {
        ...baseEnv,
        bundleType: 'indexed-ram-bundle',
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackRamBundlePlugin')
      ).toBeFalsy();
    });
  });

  describe('with multiple bundles', () => {
    const baseEnv = {
      platform: 'ios',
      root: __dirname,
      dev: false,
      singleBundleMode: false,
      bundle: true,
    };

    it('should create config', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: './host.js',
            dependsOn: ['base_dll'],
          },
          base_dll: {
            entry: './dll.js',
            dll: true,
            type: 'indexed-ram-bundle',
          },
          app: {
            entry: './spp.js',
            app: true,
            dependsOn: ['base_dll'],
            type: 'indexed-ram-bundle',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundleOutput: __dirname,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(
        hasPlugin(config.webpackConfigs.base_dll, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
      expect(
        hasPlugin(config.webpackConfigs.app, 'WebpackRamBundlePlugin')
      ).toBeTruthy();
      expect(replacePathsInObject(config)).toMatchSnapshot();
    });

    it('should create config for packager server', () => {
      const projectConfig: ProjectConfig = {
        bundles: {
          index: {
            entry: './host.js',
            dependsOn: ['base_dll'],
          },
          base_dll: {
            entry: './dll.js',
            dll: true,
            type: 'indexed-ram-bundle',
          },
          app: {
            entry: './spp.js',
            app: true,
            dependsOn: ['base_dll'],
            type: 'indexed-ram-bundle',
          },
        },
      };
      const env: EnvOptions = {
        ...baseEnv,
        bundle: false,
      };
      const config = makeConfig(projectConfig)(runtime, env);
      expect(
        hasPlugin(config.webpackConfigs.index, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(
        hasPlugin(config.webpackConfigs.base_dll, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(
        hasPlugin(config.webpackConfigs.app, 'WebpackBasicBundlePlugin')
      ).toBeTruthy();
      expect(replacePathsInObject(config)).toMatchSnapshot();
    });
  });
});
