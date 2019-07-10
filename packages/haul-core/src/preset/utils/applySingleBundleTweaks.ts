import path from 'path';
import webpack from 'webpack';
import {
  EnvOptions,
  NormalizedBundleConfig,
  NormalizedTemplatesConfig,
} from '../../config/types';
import compileTemplate from './compileTemplate';

export default function applySingleBundleTweaks(
  env: EnvOptions,
  templatesConfig: NormalizedTemplatesConfig,
  bundleConfig: NormalizedBundleConfig,
  webpackConfig: webpack.Configuration
) {
  if (env.bundleOutput) {
    webpackConfig.output!.filename = path.isAbsolute(env.bundleOutput)
      ? path.relative(webpackConfig.output!.path!, env.bundleOutput)
      : path.relative(
          webpackConfig.output!.path!,
          path.join(bundleConfig.root, env.bundleOutput)
        );
  } else {
    webpackConfig.output!.filename = compileTemplate(
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
}
