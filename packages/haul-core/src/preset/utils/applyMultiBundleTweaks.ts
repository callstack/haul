import path from 'path';
import webpack from 'webpack';
import {
  EnvOptions,
  NormalizedBundleConfig,
  NormalizedTemplatesConfig,
} from '../../config/types';
import compileTemplate from './compileTemplate';

export function getBundleFilename(
  env: EnvOptions,
  templatesConfig: NormalizedTemplatesConfig,
  bundleConfig: NormalizedBundleConfig
) {
  return compileTemplate(
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
}

export default function applyMultiBundleTweaks(
  env: EnvOptions,
  templatesConfig: NormalizedTemplatesConfig,
  bundleConfig: NormalizedBundleConfig,
  webpackConfig: webpack.Configuration,
  normalizedBundleConfigs: { [bundleName: string]: NormalizedBundleConfig }
) {
  let bundleFilename = getBundleFilename(env, templatesConfig, bundleConfig);

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
    const dllNormalizedBundleConfig = normalizedBundleConfigs[dllBundleName];
    if (!dllNormalizedBundleConfig) {
      throw new Error(
        `Cannot find bundle config for DLL '${dllBundleName}' - make sure it's listed in config before any other bundle depends on it.`
      );
    }

    webpackConfig.plugins!.push(
      new webpack.DllReferencePlugin({
        context: bundleConfig.root,
        manifest: dllNormalizedBundleConfig.external
          ? dllNormalizedBundleConfig.external.manifestPath!
          : path.join(bundleOutputDirectory, `${dllBundleName}.manifest.json`),
        sourceType: 'this',
      })
    );
  });
}
