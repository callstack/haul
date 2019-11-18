import webpack from 'webpack';
import {
  NormalizedServerConfig,
  NormalizedBundleConfig,
} from '../../config/types';

export default function getSourceMapPlugin(
  bundleConfig: NormalizedBundleConfig,
  serverConfig: NormalizedServerConfig
) {
  const baseOptions = {
    test: /\.(js|jsx|css|ts|tsx|(js)?bundle)($|\?)/i,
    module: true,
  };

  if (bundleConfig.sourceMap === 'inline') {
    return new webpack.EvalSourceMapDevToolPlugin({
      ...baseOptions,
      publicPath: `http://${serverConfig.host}:${serverConfig.port}/`,
    } as webpack.EvalSourceMapDevToolPluginOptions);
  } else if (bundleConfig.sourceMap) {
    return new webpack.SourceMapDevToolPlugin({
      ...baseOptions,
      filename: '[file].map',
      moduleFilenameTemplate: '[absolute-resource-path]',
    });
  }

  return undefined;
}
