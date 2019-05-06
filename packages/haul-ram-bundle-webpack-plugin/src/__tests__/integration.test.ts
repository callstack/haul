import path from 'path';
import webpack from 'webpack';
import vm from 'vm';
import fs from 'fs';
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import RamBundlePlugin from '../WebpackRamBundlePlugin';

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function build(namedModules: boolean = false) {
  const compiler = webpack({
    entry: path.join(__dirname, './__fixtures__/index.js'),
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
      path: path.join(__dirname, './__fixtures__/dist'),
    },
    target: 'webworker',
    plugins: [new RamBundlePlugin({ filename: 'index.ram' })],
    optimization: {
      namedModules,
    },
  });

  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
}

describe('should build and successfully evaluate bundle', () => {
  it('with namedModules:false', async () => {
    await build();

    const bundle = fs.readFileSync(
      path.join(__dirname, './__fixtures__/dist/index.ram')
    );
    const parser = new RamBundleParser(bundle);
    const bootstrapCode = parser.getStartupCode();
    expect(bootstrapCode).toBeDefined();
    const script = new vm.Script(bootstrapCode, { filename: 'ram_bundle.js' });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = parser.getModule(moduleId);
        vm.runInContext(source, context);
      },
      global: undefined,
      done: undefined,
      crash: undefined,
    };
    (global as any).global = global;
    context = vm.createContext(global);

    let error: Error | undefined;
    try {
      script.runInContext(context);
    } catch (err) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(global.done).toBe(true);

    await wait(1);

    expect(global.crash).toBeDefined();
    expect(() => {
      ((global as any) as { crash: Function }).crash();
    }).toThrow('test error');
  });

  it('with namedModules:true', async () => {
    await build(true);

    const bundle = fs.readFileSync(
      path.join(__dirname, './__fixtures__/dist/index.ram')
    );
    const parser = new RamBundleParser(bundle);
    const bootstrapCode = parser.getStartupCode();
    expect(bootstrapCode).toBeDefined();
    const script = new vm.Script(bootstrapCode, { filename: 'ram_bundle.js' });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = parser.getModule(moduleId);
        vm.runInContext(source, context);
      },
      global: undefined,
      done: undefined,
    };
    (global as any).global = global;
    context = vm.createContext(global);

    let error: Error | undefined;
    try {
      script.runInContext(context);
    } catch (err) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(global.done).toBe(true);
  });
});
