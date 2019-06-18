import { Arguments } from 'yargs';
import webpack from 'webpack';
import {
  Runtime,
  getProjectConfigPath,
  getNormalizedProjectConfigBuilder,
  sortBundlesByDependencies,
} from '@haul-bundler/core';
import * as messages from '../messages/multiBundleMessages';
import SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';

export default function multiBundleCommand(runtime: Runtime) {
  return {
    command: 'multi-bundle',
    describe: 'Create multiple bundles to be used in multi-bundle mode',
    builder: {
      dev: {
        description:
          'If false, warnings are disabled and the bundle is minified (default: true)',
        default: true,
        type: 'boolean',
      },
      platform: {
        description: 'Either "ios" or "android" (default: "ios")',
        type: 'string',
      },
      minify: {
        description:
          'Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.',
        type: 'boolean',
      },
      'bundle-output': {
        description:
          'Directory where to store generated bundles (filename is omitted if specified)',
        type: 'string',
      },
      'assets-dest': {
        description:
          'Directory name where to store bundles and assets referenced in the bundle.',
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
        } = argv;

        const directory = process.cwd();
        const configPath = getProjectConfigPath(directory, config);
        const normalizedProjectConfigBuilder = getNormalizedProjectConfigBuilder(
          configPath
        );
        const projectConfig = normalizedProjectConfigBuilder(runtime, {
          platform,
          root: directory,
          dev,
          singleBundleMode: false,
          bundleOutput,
          assetsDest,
          sourcemapOutput,
          minify: minify === undefined ? !dev : minify,
          bundle: true,
        });

        for (const bundleName of sortBundlesByDependencies(projectConfig)) {
          try {
            const webpackConfig = projectConfig.webpackConfigs[bundleName];

            // Attach progress plugin
            if (progress !== 'none') {
              webpackConfig.plugins!.push(new SimpleProgressWebpackPlugin({
                format: progress,
              }) as webpack.Plugin);
            }

            messages.initialBundleInformation(runtime, {
              bundleName,
              webpackConfig,
            });
            const stats = await build(webpackConfig);
            runtime.logger.print('');
            messages.bundleBuilt(runtime, { stats });
          } catch (error) {
            runtime.logger.error(`${bundleName} bundle compilation failed`);
            throw error;
          }
        }

        runtime.logger.done(
          'All bundles successfully compiled. You can now run your React Native multi-bundle app.'
        );
        runtime.complete();
      } catch (error) {
        runtime.logger.error(error);
        runtime.complete(1);
      }
    },
  };
}

function build(webpackConfig: webpack.Configuration) {
  const compiler = webpack(webpackConfig);
  return new Promise<webpack.Stats>((resolve, reject) =>
    compiler.run((err, info) => {
      if (err || info.hasErrors()) {
        reject(
          new Error(err ? err : info.toJson({ errorDetails: true }).errors)
        );
      } else {
        resolve(info);
      }
    })
  );
}
