import webpack from 'webpack';
import ReactNativeEnvPlugin from './plugins/ReactNativeEnvPlugin';

/**
 * // Based on Webpack's webworker target:
 * https://github.com/webpack/webpack/blob/master/lib/WebpackOptionsApply.js#L84
 *
 * Webworker resembles the React Native JS execution environment the most with few
 * differences, which are tweaked with ReactNativeEnvPlugin.
 * Adding ReactNativeEnvPlugin directly to config's plugins list
 * does not result in correct bundle for some reason.
 */
export default function ReactNativeTarget(compiler: webpack.Compiler) {
  // Load modules using require, since we don't really care about types here.
  const WebWorkerTemplatePlugin = require('webpack/lib/webworker/WebWorkerTemplatePlugin');
  const NodeSourcePlugin = require('webpack/lib/node/NodeSourcePlugin');
  const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin');
  const LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin');

  new WebWorkerTemplatePlugin().apply(compiler);
  new FunctionModulePlugin().apply(compiler);
  new NodeSourcePlugin(compiler.options.node).apply(compiler);
  new LoaderTargetPlugin(compiler.options.target).apply(compiler);

  // Apply React Native tweaks
  new ReactNativeEnvPlugin().apply(compiler);
}
