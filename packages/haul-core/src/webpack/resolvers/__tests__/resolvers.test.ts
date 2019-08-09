import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import AssetResolver from '../AssetResolver';
// @ts-ignore
import config from './__fixtures__/webpack.config.js';

const filesFromEntry = [
  require.resolve('./__fixtures__/file.pdf'),
  require.resolve('./__fixtures__/file@1x.jpeg'),
  require.resolve('./__fixtures__/file@3x.png'),
  require.resolve('./__fixtures__/file@2x.gif'),
];

const runWebpack = (
  assertion: (assetPaths: Array<string>) => void,
  done: Function & { fail: (error: Error | string) => void }
) => {
  webpack(config, (err, stats) => {
    if (err) {
      done.fail(err);
    } else if (stats.hasErrors()) {
      done.fail(stats.toString());
    }
    const assetPaths = stats
      .toJson()
      .modules!.map((module: any) => module.identifier);

    try {
      assertion(assetPaths);
      done();
    } catch (error) {
      done.fail(error);
    }
  });
};

test('resolves to file@{number}x.{ext} if file.{ext} not present', done => {
  runWebpack(assetPaths => {
    expect(assetPaths).toEqual(expect.arrayContaining(filesFromEntry));
  }, done);
});

test('resolves Haste modules', done => {
  runWebpack(assetPaths => {
    expect(assetPaths).toEqual(
      expect.arrayContaining([require.resolve('./__fixtures__/HasteModule.js')])
    );
  }, done);
});

test('AssetResolver.collect returns empty object for empty list', () => {
  const result = AssetResolver.collect([], {
    name: 'filename',
    type: 'jpeg',
    platform: 'native',
  });

  expect(result).toEqual({});
});

test('AssetResolver.collect returns empty object when file not in the list', () => {
  const result = AssetResolver.collect(['file.jpeg', 'filename.png'], {
    name: 'filename',
    type: 'jpeg',
    platform: 'android',
  });

  expect(result).toEqual({});
});

test('AssetResolver.collect returns files based on requested platform', () => {
  const fileList = [
    'mail.android.png',
    'mail.png',
    'mail@2x.android.png',
    'mail@2x.png',
    'mail@3x.android.png',
    'mail@3x.png',
    'mail.ios.png',
    'mail.native.png',
  ];
  const fileListDifferentOrder = [
    'mail.ios.png',
    'mail.native.png',
    'mail.png',
    'mail.android.png',
    'mail@2x.png',
    'mail@2x.android.png',
    'mail@3x.png',
    'mail@3x.android.png',
  ];

  [fileList, fileListDifferentOrder].forEach(files => {
    const result = AssetResolver.collect(files, {
      name: 'mail',
      type: 'png',
      platform: 'android',
    });
    expect(result).toEqual({
      '@1x': {
        name: 'mail.android.png',
        platform: 'android',
      },
      '@2x': {
        name: 'mail@2x.android.png',
        platform: 'android',
      },
      '@3x': {
        name: 'mail@3x.android.png',
        platform: 'android',
      },
    });
  });
});

test('AssetResolver.collect returns a map of paths to resolve', () => {
  const files = fs.readdirSync(path.resolve(__dirname, './__fixtures__'));
  const result = AssetResolver.collect(files, {
    name: 'filename',
    type: 'jpeg',
    platform: 'ios',
  });

  expect(result).toMatchSnapshot();
});
