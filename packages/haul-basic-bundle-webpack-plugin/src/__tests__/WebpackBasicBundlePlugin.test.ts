import WebpackBasicBundlePlugin from '..';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';
import del from 'del';

const getRandomId = () => Math.floor(100000 + Math.random() * 900000);

async function build(config: webpack.Configuration) {
  return new Promise<string>((resolve, reject) => {
    webpack(config).run((error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(
          fs.readFileSync(
            path.join(
              stats.compilation.outputOptions.path,
              stats.compilation.outputOptions.filename
            ),
            'utf-8'
          )
        );
      }
    });
  });
}

const getConfig = () =>
  ({
    mode: 'development',
    devtool: false,
    entry: require.resolve('./__fixtures__/entry.js'),
    output: {
      path: path.join(__dirname, '__fixtures__', `tmp-${getRandomId()}`),
      filename: 'index.bundle',
    },
    target: 'webworker',
  } as webpack.Configuration);

describe('WebpackBasicBundlePlugin', () => {
  afterAll(async () => {
    await del(path.join(__dirname, './__fixtures__/tmp-*'));
  });

  it('should prepare bundle for packager server', async () => {
    const bundle = await build({
      ...getConfig(),
      plugins: [
        new WebpackBasicBundlePlugin({
          bundle: false,
        }),
      ],
    });

    expect(bundle).toMatch(/function asyncEval/);
    expect(bundle).toMatch(/return asyncEval\(.+\)/);
    expect(bundle).toMatch(/console.log\('entry'\)/);
    expect(bundle).not.toMatch(/console.log\('async'\)/);
    expect(bundle).not.toMatch(/bundleRegistryLoad/);
  });

  it('should prepare bundle for packager server with preload bundles', async () => {
    const bundle = await build({
      ...getConfig(),
      plugins: [
        new WebpackBasicBundlePlugin({
          bundle: false,
          preloadBundles: ['test_bundle'],
        }),
      ],
    });

    expect(bundle).toMatch(/function asyncEval/);
    expect(bundle).toMatch(/return asyncEval\(.+\)/);
    expect(bundle).toMatch(/console.log\('entry'\)/);
    expect(bundle).not.toMatch(/console.log\('async'\)/);
    expect(bundle).toMatch(
      /if \(!this\["test_bundle"\]\) { this.bundleRegistryLoad\("test_bundle", true, true\); }/
    );
  });

  it('should prepare offline bundle', async () => {
    const bundle = await build({
      ...getConfig(),
      plugins: [
        new WebpackBasicBundlePlugin({
          bundle: true,
          preloadBundles: ['test_bundle'],
        }),
      ],
    });

    expect(bundle).not.toMatch(/asyncEval/);
    expect(bundle).not.toMatch(/return asyncEval\(.+\)/);
    expect(bundle).toMatch(/Invalid bundle: async chunk not loaded/);
    expect(bundle).toMatch(/console.log\('entry'\)/);
    expect(bundle).toMatch(/console.log\('async'\)/);
    expect(bundle).toMatch(
      /if \(!this\["test_bundle"\]\) { this.bundleRegistryLoad\("test_bundle", true, true\); }/
    );
  });

  it('should prepare offline bundle and merge sourcemaps', async () => {
    const bundle = await build({
      ...getConfig(),
      plugins: [
        new webpack.SourceMapDevToolPlugin({
          test: /\.(js|jsx|css|ts|tsx|(js)?bundle)($|\?)/i,
          module: true,
          filename: '[file].map',
          moduleFilenameTemplate: '[absolute-resource-path]',
        }),
        new WebpackBasicBundlePlugin({
          bundle: true,
          sourceMap: true,
          preloadBundles: ['test_bundle'],
        }),
      ],
    });

    expect(bundle).not.toMatch(/asyncEval/);
    expect(bundle).not.toMatch(/return asyncEval\(.+\)/);
    expect(bundle).toMatch(/Invalid bundle: async chunk not loaded/);
    expect(bundle).toMatch(/console.log\('entry'\)/);
    expect(bundle).toMatch(/console.log\('async'\)/);
    expect((bundle.match(/sourceMappingURL/g) || []).length).toBe(1);
    expect(bundle).toMatch(
      /if \(!this\["test_bundle"\]\) { this.bundleRegistryLoad\("test_bundle", true, true\); }/
    );
  });
});
