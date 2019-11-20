import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import del from 'del';
import LooseModeWebpackPlugin from '../LooseModeWebpackPlugin';

async function build(plugin: webpack.Plugin) {
  const FILENAME = 'bundle.js';
  const DIR = path.join(__dirname, './__fixtures__/tmp');

  del.sync(DIR);

  return new Promise((resolve, reject) => {
    webpack({
      mode: 'development',
      entry: path.join(__dirname, './__fixtures__/index.js'),
      output: {
        path: DIR,
        filename: 'bundle.js',
      },
      plugins: [plugin],
    }).run(error => {
      if (error) {
        reject(error);
      } else {
        const bundle = fs.readFileSync(path.join(DIR, FILENAME)).toString();
        del.sync(DIR);
        resolve(bundle);
      }
    });
  });
}

describe('LooseModeWebpackPlugin', () => {
  it('should remove use strict', async () => {
    const bundle = await build(new LooseModeWebpackPlugin(() => true));
    expect(bundle).not.toMatch('use strict');
  });
});
