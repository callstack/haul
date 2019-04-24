import { Arguments } from 'yargs';
import path from 'path';
import webpack from 'webpack';
import getWebpackConfigPath from 'haul-core-legacy/build/utils/getWebpackConfigPath';
import getConfig from 'haul-core-legacy/build/utils/getConfig';
import SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';
import * as messages from '../messages/ramBundleMessages';
import Runtime from '../Runtime';

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
          progress,
        } = argv;

        // TODO: figure out a better way to read and transpile user files on-demand
        require('haul-core-legacy/build/babelRegister');

        const directory = process.cwd();
        const configPath = getWebpackConfigPath(directory, config);

        const webpackConfig = getConfig(
          configPath,
          {
            root: directory,
            dev: dev,
            minify: minify === undefined ? !dev : minify,
            bundle: true,
          },
          platform,
          runtime.logger
        );

        if (assetsDest) {
          webpackConfig.output!.path = path.isAbsolute(assetsDest)
            ? assetsDest
            : path.join(directory, assetsDest);
        }

        if (bundleOutput) {
          webpackConfig.output!.filename = path.isAbsolute(bundleOutput)
            ? path.relative(webpackConfig.output!.path!, bundleOutput)
            : path.relative(
                webpackConfig.output!.path!,
                path.join(directory, bundleOutput)
              );
        }

        messages.initialInformation(runtime, { config: webpackConfig });

        // Attach progress plugin
        if (progress !== 'none') {
          webpackConfig.plugins!.push(new SimpleProgressWebpackPlugin({
            format: progress,
          }) as webpack.Plugin);
        }

        messages.initialBundleInformation(runtime, {
          entry: webpackConfig.entry as string[],
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
