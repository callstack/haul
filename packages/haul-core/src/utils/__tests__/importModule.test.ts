import importModule from '../importModule';
import * as babel from '@babel/core';
import Runtime from '../../runtime/Runtime';
import { join } from 'path';

jest.mock('@babel/core');

describe('importModule', () => {
  it('should evaluate and not transpile Node-compatible code', () => {
    (babel.transformSync as jest.Mock).mockImplementation(() => {
      throw new Error('should not be called');
    });

    const { exports: fn, cache } = importModule('./__fixtures__/moduleA.js', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(typeof fn).toEqual('function');
    expect(fn()).toEqual('moduleA');

    const filename = require.resolve('./__fixtures__/moduleA.js');
    expect(cache[filename]).toBeDefined();
    expect(cache[filename].id).toEqual(filename);
    expect(cache[filename].filename).toEqual(filename);
    expect(cache[filename].loaded).toBeTruthy();
    expect(typeof cache[filename].exports).toEqual('function');
    expect(Object.keys(cache).length).toBe(1);
  });

  it('should transpile and evaluate a JS module', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const {
      exports: { default: fn, CONST_1 },
      cache,
    } = importModule('./__fixtures__/moduleB.js', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(typeof fn).toEqual('function');
    expect(fn()).toEqual('moduleB');
    expect(CONST_1).toEqual('const_1');

    const filename = require.resolve('./__fixtures__/moduleB.js');
    expect(cache[filename]).toBeDefined();
    expect(cache[filename].id).toEqual(filename);
    expect(cache[filename].filename).toEqual(filename);
    expect(cache[filename].loaded).toBeTruthy();
    expect(typeof cache[filename].exports.default).toEqual('function');
    expect(cache[filename].exports.CONST_1).toEqual('const_1');
    expect(Object.keys(cache).length).toBe(1);
  });

  it('should transpile and evaluate a TS module', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const {
      exports: { default: Class },
      cache,
    } = importModule('./__fixtures__/moduleC.ts', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(typeof Class).toEqual('function');
    expect(new Class().data).toEqual(['hello world']);

    const filename = require.resolve('./__fixtures__/moduleC.ts');
    expect(cache[filename]).toBeDefined();
    expect(cache[filename].id).toEqual(filename);
    expect(cache[filename].filename).toEqual(filename);
    expect(cache[filename].loaded).toBeTruthy();
    expect(typeof cache[filename].exports.default).toEqual('function');
    expect(Object.keys(cache).length).toBe(1);
  });

  it('should properly import JSON file', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const {
      exports: { default: data },
      cache,
    } = importModule('./__fixtures__/data.js', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(data).toEqual({
      messages: [
        {
          id: 1,
          text: 'Hello World',
        },
      ],
    });

    const jsFilename = require.resolve('./__fixtures__/data.js');
    const jsonFilename = require.resolve('./__fixtures__/data.json');
    expect(cache[jsFilename]).toBeDefined();
    expect(cache[jsFilename].id).toEqual(jsFilename);
    expect(cache[jsFilename].filename).toEqual(jsFilename);
    expect(cache[jsFilename].loaded).toBeTruthy();
    expect(cache[jsFilename].exports.default).toEqual(data);
    expect(cache[jsonFilename]).toBeDefined();
    expect(cache[jsonFilename].id).toEqual(jsonFilename);
    expect(cache[jsonFilename].filename).toEqual(jsonFilename);
    expect(cache[jsonFilename].loaded).toBeTruthy();
    expect(cache[jsonFilename].exports).toEqual(data);
    expect(Object.keys(cache).length).toBe(2);
  });

  it('should import webpack without errors', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const { exports: webpack, cache } = importModule('webpack', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(typeof webpack).toEqual('function');
    expect(webpack.name).toEqual('webpack');

    const filename = require.resolve('webpack');
    expect(cache[filename]).toBeDefined();
    expect(cache[filename].id).toEqual(filename);
    expect(cache[filename].filename).toEqual(filename);
    expect(cache[filename].loaded).toBeTruthy();
    expect(cache[filename].exports.name).toEqual('webpack');

    expect(require.cache[filename]).not.toBeDefined();
  });

  it('should import @babel/core without errors', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const { exports: importedBabel, cache } = importModule('@babel/core', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(typeof importedBabel.transformSync).toEqual('function');
    expect(importedBabel.transformSync.name).toEqual('transformSync');

    const filename = require.resolve('@babel/core');
    expect(cache[filename]).toBeDefined();
    expect(cache[filename].id).toEqual(filename);
    expect(cache[filename].filename).toEqual(filename);
    expect(cache[filename].loaded).toBeTruthy();
    expect(cache[filename].exports.transformSync.name).toEqual('transformSync');

    expect(require.cache[filename]).not.toBeDefined();
  });

  it('should provide correct require.resolve', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    const {
      exports: { default: resolved },
      cache,
    } = importModule('./__fixtures__/nested/moduleE.js', {
      resolve: require.resolve,
      runtime: new Runtime(),
    });

    expect(resolved).toEqual(require.resolve('./__fixtures__/moduleA.js'));
    expect(Object.keys(cache).length).toBe(1);
  });

  it('should not transpile if file is ignored', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    expect(() => {
      importModule('./__fixtures__/moduleB.js', {
        resolve: require.resolve,
        runtime: new Runtime(),
        ignore: [/moduleB/],
      });
    }).toThrow('Unexpected token');

    expect(() => {
      importModule('./__fixtures__/moduleC.ts', {
        resolve: require.resolve,
        runtime: new Runtime(),
        ignore: [join(__dirname, './__fixtures__')],
      });
    }).toThrow('Unexpected token');

    expect(() => {
      importModule('./__fixtures__/moduleC.ts', {
        resolve: require.resolve,
        runtime: new Runtime(),
        ignore: filename => {
          expect(filename).toEqual(
            require.resolve('./__fixtures__/moduleC.ts')
          );
          return true;
        },
      });
    }).toThrow('Unexpected token');
  });

  it('should log filename if transpilation fails', () => {
    (babel.transformSync as jest.Mock).mockImplementation((...args: any[]) => {
      return require.requireActual('@babel/core').transformSync(...args);
    });

    let logged = false;
    const runtime = new Runtime();
    runtime.logger.proxy((level, ...args) => {
      expect(level).toEqual('error');
      expect(args).toEqual([
        `Failed to transpile module ${require.resolve(
          './__fixtures__/moduleD.js'
        )}:`,
      ]);
      logged = true;
    });

    expect(() => {
      importModule('./__fixtures__/moduleD.js', {
        resolve: require.resolve,
        runtime,
      });
    }).toThrow(
      "Support for the experimental syntax 'optionalChaining' isn't currently enabled"
    );
    expect(logged).toBeTruthy();
  });
});
