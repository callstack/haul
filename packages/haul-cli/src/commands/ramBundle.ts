import { Arguments } from 'yargs';
import webpack from 'webpack';
import RamBundlePlugin from '@haul-bundler/ram-bundle-webpack-plugin';
import * as messages from '../messages/bundleMessages';
import {
  getProjectConfigPath,
  getProjectConfig,
  getRamBundleConfig,
  Runtime,
} from '@haul-bundler/core';
import prepareWebpackConfig from './shared/prepareWebpackConfig';

export default function ramBundleCommand(runtime: Runtime) {
  return {
    command: 'ram-bundle',
    describe: 'Create ram-bundle',
    builder: {
      dev: {
        description:
          'If false, warnings are disabled and the bundle is minified (default: true)',
        default: true,
        type: 'boolean',
      },
      'entry-file': {
        description:
          'Path to the root JS file, either absolute or relative to JS root',
        type: 'string',
      },
      platform: {
        description: 'Either "ios" or "android" (default: "ios")',
        type: 'string',
      },
      'indexed-ram-bundle': {
        description:
          'Force the "Indexed RAM" bundle file format, even when building for android.',
        type: 'boolean',
      },
      minify: {
        description:
          'Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.',
        type: 'boolean',
      },
      'bundle-output': {
        description:
          'File name where to store the resulting bundle, ex. /tmp/groups.bundle.',
        type: 'string',
      },
      'assets-dest': {
        description:
          'Directory name where to store assets referenced in the bundle.',
        type: 'string',
      },
      'sourcemap-output': {
        description: 'File name where to store generated source map',
        type: 'string',
      },
      config: {
        description: 'Path to the CLI configuration file',
        type: 'string',
      },
      progress: {
        description:
          'Display bundle compilation progress with different verbosity levels',
        // Ensure that we don't trip Xcode's error detection. 'verbose' is the
        // only level that doesn't make Xcode think that the bundle failed.
        default: !process.stdin.isTTY ? 'verbose' : 'compact',
        choices: ['none', 'minimal', 'compact', 'expanded', 'verbose'],
      },
    },
    async handler(
      argv: Arguments<{
        config?: string;
        dev: boolean;
        minify?: boolean;
        platform: string;
        assetsDest?: string;
        bundleOutput?: string;
        sourcemapOutput?: string;
        indexedRamBundle?: boolean;
        progress: string;
      }>
    ) {
      try {
        const {
          config,
          dev,
          minify,
          platform,
          assetsDest,
          bundleOutput,
          sourcemapOutput,
          progress,
          indexedRamBundle,
        } = argv;

        const webpackConfig = prepareWebpackConfig(runtime, {
          config,
          dev,
          minify,
          platform,
          assetsDest,
          bundleOutput,
          sourcemapOutput,
          progress,
        });
        messages.initialInformation(runtime, { config: webpackConfig });

        const directory = process.cwd();
        const configPath = getProjectConfigPath(directory, config);
        const projectConfig = getProjectConfig(configPath);
        const ramBundleConfig = getRamBundleConfig(projectConfig);

        webpackConfig.plugins!.push(
          new RamBundlePlugin({
            config: {
              ...ramBundleConfig,
              minification: {
                ...ramBundleConfig.minification,
                enabled: Boolean(minify === undefined ? !dev : minify),
              },
            },
            sourceMap: Boolean(sourcemapOutput),
            indexRamBundle:
              indexedRamBundle === undefined
                ? platform !== 'android'
                : indexedRamBundle,
            platform,
            singleBundleMode: true,
          })
        );

        messages.initialBundleInformation(runtime, {
          entry: webpackConfig.entry,
          dev,
        });

        const compiler = webpack(webpackConfig);
        const stats = await new Promise<webpack.Stats>((resolve, reject) =>
          compiler.run((err, info) => {
            if (err || info.hasErrors()) {
              messages.buildFailed(runtime);
              reject(err ? err : info.toJson({ errorDetails: true }).errors);
            } else {
              resolve(info);
            }
          })
        );

        messages.bundleBuilt(runtime, {
          stats,
          platform,
          assetsPath: webpackConfig.output!.path,
          bundlePath: webpackConfig.output!.filename,
        });
        runtime.complete();
      } catch (error) {
        runtime.logger.error(error);
        runtime.complete(1);
      }
    },
  };
}
