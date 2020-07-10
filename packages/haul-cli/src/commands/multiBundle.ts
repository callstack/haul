import { Arguments } from 'yargs';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import cpx from 'cpx';
import {
  Runtime,
  Configuration,
  EnvOptions,
  ExternalBundle,
  BundleOutputPlugin,
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
          'Display bundle compilation progress with different verbosity levels. Note that logging the compilation progress will increase build time. Defaults to `none` when you are building in production mode.',
        choices: ['none', 'minimal', 'compact', 'expanded', 'verbose'],
      },
      'skip-host-check': {
        description: 'Skips check for "index" or "host" bundle in Haul config',
        type: 'boolean',
      },
      'max-workers': {
        description: 'Number of workers used to load modules',
        type: 'number',
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
        skipHostCheck?: boolean;
        maxWorkers?: number;
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
          skipHostCheck,
          maxWorkers,
        } = argv;

        process.env.HAUL_PLATFORM = platform;

        const directory = process.cwd();
        const env: EnvOptions = {
          platform,
          root: directory,
          dev,
          bundleMode: 'multi-bundle',
          bundleTarget: 'file',
          bundleOutput,
          assetsDest,
          sourcemapOutput,
          minify: minify === undefined ? !dev : minify,
          maxWorkers,
        };
        const optionsWithProgress = {
          ...env,
          progress:
            progress !== undefined
              ? progress
              : !dev
              ? 'none'
              : // Ensure that we don't trip Xcode's error detection. 'verbose' is the
              // only level that doesn't make Xcode think that the bundle failed.
              !process.stdin.isTTY
              ? 'verbose'
              : 'compact',
        };

        const configuration = Configuration.getLoader(
          runtime,
          directory,
          config
        ).load(optionsWithProgress);

        const bundles = configuration.createBundlesSorted(runtime, {
          skipHostCheck,
        });

        for (const bundle of bundles) {
          const bundleName = bundle.name;
          if (ExternalBundle.isExternal(bundle)) {
            runtime.logger.info(
              `Using external ${bundle.properties.type} bundle`,
              runtime.logger.enhanceWithModifier('bold', bundleName)
            );
            runtime.logger.info(
              'Bundle path',
              runtime.logger.enhanceWithColor(
                'gray',
                bundle.properties.bundlePath
              )
            );
            if (bundle.properties.type === 'dll') {
              runtime.logger.info(
                'Manifest path',
                runtime.logger.enhanceWithColor(
                  'gray',
                  bundle.properties.manifestPath
                )
              );
            }

            if (bundle.properties.shouldCopy) {
              const filename = new BundleOutputPlugin({
                mode: env.dev ? 'dev' : 'prod',
                platform: env.platform,
                bundlingMode: 'multi-bundle',
                bundleName,
                bundleType: bundle.properties.type,
                templatesConfig: configuration.templates,
              }).compileFilenameTemplate();
              const bundleOutputDirectory = BundleOutputPlugin.getBundleOutputDirectory(
                env.root,
                env.root,
                env.bundleOutput
              );
              mkdirp.sync(bundleOutputDirectory);
              runtime.logger.info(
                'Copying bundle to',
                runtime.logger.enhanceWithColor(
                  'gray',
                  path.join(bundleOutputDirectory, filename)
                )
              );
              fs.copyFileSync(
                bundle.properties.bundlePath,
                path.join(bundleOutputDirectory, filename)
              );
              if (fs.existsSync(`${bundle.properties.bundlePath}.map`)) {
                fs.copyFileSync(
                  `${bundle.properties.bundlePath}.map`,
                  path.join(bundleOutputDirectory, `${filename}.map`)
                );
                runtime.logger.info(
                  'Copying bundle source maps to',
                  runtime.logger.enhanceWithColor(
                    'gray',
                    path.join(bundleOutputDirectory, `${filename}.map`)
                  )
                );
              }

              let assetsOutputDirectory = env.root;
              if (env.assetsDest) {
                assetsOutputDirectory = env.assetsDest;
              } else if (env.bundleOutput) {
                assetsOutputDirectory = env.bundleOutput;
              }
              assetsOutputDirectory = path.isAbsolute(assetsOutputDirectory)
                ? assetsOutputDirectory
                : path.join(env.root, assetsOutputDirectory);

              cpx.copySync(
                path.join(
                  bundle.properties.assetsPath,
                  '**/*.{aac,aiff,bmp,caf,gif,html,jpeg,jpg,m4a,m4v,mov,mp3,mp4,mpeg,mpg,obj,otf,pdf,png,psd,svg,ttf,wav,webm,webp}'
                ),
                assetsOutputDirectory,
                {
                  preserve: true,
                }
              );
            }
            continue;
          }

          try {
            const webpackConfig = bundle.makeWebpackConfig(configuration);

            // Attach progress plugin
            if (progress !== 'none') {
              webpackConfig.plugins!.push(
                new SimpleProgressWebpackPlugin({
                  format: progress,
                }) as webpack.Plugin
              );
            }

            const stats = await build(bundleName, runtime, webpackConfig);
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

function build(
  bundleName: string,
  runtime: Runtime,
  webpackConfig: webpack.Configuration
) {
  const compiler = webpack(webpackConfig);
  compiler.hooks.compile.tap('HaulBundleCommand', () => {
    messages.initialBundleInformation(runtime, {
      bundleName,
      compiler,
    });
  });

  return new Promise<webpack.Stats>((resolve, reject) =>
    compiler.run((err, info) => {
      if (err || info.hasErrors()) {
        reject(
          err
            ? err
            : new Error(info.toJson({ errorDetails: true }).errors.join('\n'))
        );
      } else {
        resolve(info);
      }
    })
  );
}
