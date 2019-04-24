import path from 'path';
import webpack from 'webpack';
import vm from 'vm';
import fs from 'fs';
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import RamBundlePlugin from '../WebpackRamBundlePlugin';

function build() {
  const compiler = webpack({
    entry: path.join(__dirname, './__fixtures__/index.js'),
    mode: 'development',
    devtool: 'source-map',
    output: {
      path: path.join(__dirname, './__fixtures__/dist'),
    },
    plugins: [new RamBundlePlugin({ filename: 'index.ram' })],
    optimization: {
      namedModules: false,
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

test('should build and successfully evaluate bundle', async () => {
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
  };
  global.global = global;
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
