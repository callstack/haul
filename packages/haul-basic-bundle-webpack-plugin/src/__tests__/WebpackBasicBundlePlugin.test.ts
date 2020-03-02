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

  it('should prepare bundle', async () => {
    const bundle = await build({
      ...getConfig(),
      plugins: [
        new WebpackBasicBundlePlugin({
          preloadBundles: ['test_bundle'],
        }),
      ],
    });

    expect(bundle).toMatch(/console.log\('entry'\)/);
    expect(bundle).not.toMatch(/console.log\('async'\)/);
    expect(bundle).toMatch(
      /if \(!this\["test_bundle"\]\) { this.bundleRegistryLoad\("test_bundle", true, true\); }/
    );
  });
});
