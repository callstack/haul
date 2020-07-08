import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import del from 'del';
import { LooseModePlugin } from '../LooseModePlugin';

async function build(plugin: webpack.Plugin) {
  const FILENAME = 'bundle.js';
  const DIR = path.join(__dirname, './__fixtures__/tmp');

  del.sync(DIR);

  return new Promise<string>((resolve, reject) => {
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

describe('LooseModePlugin', () => {
  it('should remove all use strict', async () => {
    const bundle = await build(new LooseModePlugin(() => true));
    expect(bundle).not.toMatch('use strict');
  });

  it('should not remove any use strict', async () => {
    const bundle = await build(new LooseModePlugin(() => false));

    expect(bundle).toMatch('use strict');
    expect((bundle.match(/use strict/g) || []).length).toBe(2);
  });

  it('should remove use strict based on array with files', async () => {
    const bundle = await build(
      new LooseModePlugin([path.join(__dirname, './__fixtures__/index.js')])
    );

    expect(bundle).toMatch('use strict');
    expect((bundle.match(/use strict/g) || []).length).toBe(1);
    const indexModuleCode = bundle.substr(
      bundle.indexOf('__fixtures__/index.js ***!')
    );
    expect(indexModuleCode).not.toMatch('use strict');
  });

  it('should remove use strict based on array with regex', async () => {
    const bundle = await build(new LooseModePlugin([/async/]));

    expect(bundle).toMatch('use strict');
    expect((bundle.match(/use strict/g) || []).length).toBe(1);
    const asyncModuleCode = bundle.substring(
      bundle.indexOf('__fixtures__/async.js ***!'),
      bundle.indexOf('__fixtures__/index.js ***!')
    );
    expect(asyncModuleCode).not.toMatch('use strict');
  });
});
