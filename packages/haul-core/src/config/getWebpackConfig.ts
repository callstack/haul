import webpack from 'webpack';
import { ProjectConfig, EnvOptions } from './types';
import Runtime from '../runtime/Runtime';

export default function getWbpackConfig(
  runtime: Runtime,
  envOptions: EnvOptions,
  projectConfig: ProjectConfig
): webpack.Configuration {
  const { webpack: webpackConfigFactory } = projectConfig;

  if (
    typeof webpackConfigFactory !== 'function' &&
    typeof webpackConfigFactory !== 'object'
  ) {
    throw new Error(
      'The webpack configuration must be an object or a function returning an object. See https://github.com/callstack/haul/blob/master/docs/Configuration.md'
    );
  }

  const webpackConfig =
    typeof webpackConfigFactory === 'function'
      ? webpackConfigFactory(runtime, envOptions)
      : webpackConfigFactory;

  if (typeof webpackConfig !== 'object' || webpackConfig === null) {
    throw new Error(
      `The arguments passed to 'createWebpackConfig' must be an object or a function returning an object.`
    );
  }

  return webpackConfig;
}
