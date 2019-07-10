import path from 'path';
import webpack from 'webpack';
import {
  EnvOptions,
  NormalizedBundleConfig,
  NormalizedTemplatesConfig,
} from '../../config/types';
import compileTemplate from './compileTemplate';

export default function applyMultiBundleTweaks(
  env: EnvOptions,
  templatesConfig: NormalizedTemplatesConfig,
  bundleConfig: NormalizedBundleConfig,
  webpackConfig: webpack.Configuration
) {
  let bundleFilename = compileTemplate(
    templatesConfig.filename[
      env.bundleTarget === 'server' ? '__server__' : bundleConfig.platform
    ],
    {
      bundleName: bundleConfig.name,
      platform: bundleConfig.platform,
      type: bundleConfig.dll ? 'dll' : bundleConfig.app ? 'app' : 'default',
      mode: bundleConfig.dev ? 'dev' : 'prod',
    }
  );

  let bundleOutputDirectory = webpackConfig.output!.path!;
  if (env.bundleOutput) {
    // `bundleOutput` should be a directory, but for backward-compatibility,
    // we also handle the case with a filename.
    bundleOutputDirectory =
      path.extname(env.bundleOutput) === ''
        ? env.bundleOutput
        : path.dirname(env.bundleOutput);
    bundleOutputDirectory = path.isAbsolute(bundleOutputDirectory)
      ? bundleOutputDirectory
      : path.join(bundleConfig.root, bundleOutputDirectory);

    const targetBundleOutput = path.join(bundleOutputDirectory, bundleFilename);
    webpackConfig.output!.filename = path.relative(
      webpackConfig.output!.path!,
      targetBundleOutput
    );
  } else {
    webpackConfig.output!.filename = bundleFilename;
  }

  if (bundleConfig.dll) {
    webpackConfig.output!.library = bundleConfig.name;
    webpackConfig.output!.libraryTarget = 'this';
    webpackConfig.plugins!.push(
      new webpack.DllPlugin({
        name: bundleConfig.name,
        path: path.join(
          bundleOutputDirectory,
          `${bundleConfig.name}.manifest.json`
        ),
      })
    );
  } else if (bundleConfig.app) {
    webpackConfig.output!.library = bundleConfig.name;
    webpackConfig.output!.libraryTarget = 'this';
  }

  bundleConfig.dependsOn.forEach((dllBundleName: string) => {
    webpackConfig.plugins!.push(
      new webpack.DllReferencePlugin({
        context: bundleConfig.root,
        manifest: path.join(
          bundleOutputDirectory,
          `${dllBundleName}.manifest.json`
        ),
        sourceType: 'this',
      })
    );
  });
}
