import path from 'path';
import webpack from 'webpack';
import vm from 'vm';
import fs from 'fs';
import assert from 'assert';
import { SourceMapConsumer } from 'source-map';
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import RamBundlePlugin from '../WebpackRamBundlePlugin';

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const BUNDLE_PATH = path.join(__dirname, './__fixtures__/dist/main.jsbundle');

function build({
  namedModules,
  sourceMap,
  indexRamBundle,
}: {
  namedModules?: boolean;
  sourceMap?: boolean;
  indexRamBundle?: boolean;
} = {}) {
  const compiler = webpack({
    entry: path.join(__dirname, './__fixtures__/index.js'),
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
      path: path.join(__dirname, './__fixtures__/dist'),
      filename: 'main.jsbundle',
      sourceMapFilename: '[file].map',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              configFile: false,
              presets: ['module:@haul-bundler/babel-preset-react-native'],
            },
          },
        },
      ],
    },
    target: 'webworker',
    plugins: [
      new RamBundlePlugin({
        sourceMap,
        indexRamBundle,
        config: { minification: { enabled: false } },
      }),
    ],
    optimization: {
      namedModules: Boolean(namedModules),
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

async function enhanceFrameWithSourceMaps(frame: string, indexSourceMap: any) {
  const [
    ,
    name,
    file,
    line,
    column,
  ] = /^at (.+) \((\d\.js):(\d+):(\d+)\)$/.exec(frame)!;
  const moduleSourceMap = indexSourceMap.sections.find(
    (section: any) => section.map.file === file
  );
  assert(moduleSourceMap, `Couldn't find source map for file ${file}`);
  const consumer = await new SourceMapConsumer(moduleSourceMap.map);
  const {
    name: origName,
    column: origColumn,
    line: origLine,
    source,
  } = consumer.originalPositionFor({
    column: parseInt(column, 10),
    line: parseInt(line, 10),
    bias: SourceMapConsumer.LEAST_UPPER_BOUND,
  });
  return `at ${origName || name} (${source}:${origLine}:${
    origColumn ? origColumn + 1 : column
  })`;
}

describe('Indexed RAM bundle should build and successfully evaluate bundle', () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  it('with namedModules:false', async () => {
    await build({ indexRamBundle: true });

    const bundle = fs.readFileSync(BUNDLE_PATH);
    const parser = new RamBundleParser(bundle);
    const bootstrapCode = parser.getStartupCode();
    expect(bootstrapCode).toBeDefined();
    const script = new vm.Script(bootstrapCode, { filename: BUNDLE_PATH });

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
    await build({ namedModules: true, indexRamBundle: true });

    const bundle = fs.readFileSync(BUNDLE_PATH);
    const parser = new RamBundleParser(bundle);
    const bootstrapCode = parser.getStartupCode();
    expect(bootstrapCode).toBeDefined();
    const script = new vm.Script(bootstrapCode, { filename: BUNDLE_PATH });

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

  it('with source maps', async () => {
    await build({ sourceMap: true, indexRamBundle: true });

    const bundle = fs.readFileSync(BUNDLE_PATH);
    const indexSourceMap = JSON.parse(
      fs.readFileSync(`${BUNDLE_PATH}.map`).toString()
    );
    const parser = new RamBundleParser(bundle);
    const bootstrapCode = parser.getStartupCode();
    expect(bootstrapCode).toBeDefined();
    const script = new vm.Script(bootstrapCode, { filename: BUNDLE_PATH });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = parser.getModule(moduleId);
        vm.runInContext(source, context, { filename: `${moduleId}.js` });
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
    let stack = '';
    try {
      ((global as any) as { crash: Function }).crash(true);
    } catch (err) {
      stack = err.stack;
    }

    const [, frame1, frame2] = stack.split('\n').map(line => line.trim());

    const mappedFrame1 = await enhanceFrameWithSourceMaps(
      frame1,
      indexSourceMap
    );
    const mappedFrame2 = await enhanceFrameWithSourceMaps(
      frame2,
      indexSourceMap
    );

    expect(mappedFrame1).toMatch('__fixtures__/nestedCrashFn.esm.js:4:13');
    expect(mappedFrame2).not.toMatch('null');
    // TODO: figure out what is wrong with source maps
    // expect(mappedFrame1).toMatch('__fixtures__/crashFn.async.js:5:5');
  });
});

describe('File RAM bundle should build and successfully evaluate bundle', () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  it('with namedModules:false', async () => {
    await build();

    const bootstrap = fs.readFileSync(BUNDLE_PATH).toString();
    expect(bootstrap).toBeDefined();
    const script = new vm.Script(bootstrap, { filename: BUNDLE_PATH });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = fs
          .readFileSync(
            path.join(path.dirname(BUNDLE_PATH), `js-modules/${moduleId}.js`)
          )
          .toString();
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
    await build({ namedModules: true });

    const bootstrap = fs.readFileSync(BUNDLE_PATH).toString();
    expect(bootstrap).toBeDefined();
    const script = new vm.Script(bootstrap, { filename: BUNDLE_PATH });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = fs
          .readFileSync(
            path.join(path.dirname(BUNDLE_PATH), `js-modules/${moduleId}.js`)
          )
          .toString();
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

  it('with source maps', async () => {
    await build({ sourceMap: true });

    const indexSourceMap = JSON.parse(
      fs.readFileSync(`${BUNDLE_PATH}.map`).toString()
    );
    const bootstrap = fs.readFileSync(BUNDLE_PATH).toString();
    expect(bootstrap).toBeDefined();
    const script = new vm.Script(bootstrap, { filename: BUNDLE_PATH });

    let context: vm.Context;
    const global = {
      nativeRequire: (localId: number, segmentId: number) => {
        // pack module id from local id and segment id
        const moduleId = (segmentId << 16) + localId;
        const source = fs
          .readFileSync(
            path.join(path.dirname(BUNDLE_PATH), `js-modules/${moduleId}.js`)
          )
          .toString();
        vm.runInContext(source, context, { filename: `${moduleId}.js` });
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
    let stack = '';
    try {
      ((global as any) as { crash: Function }).crash(true);
    } catch (err) {
      stack = err.stack;
    }

    const [, frame1, frame2] = stack.split('\n').map(line => line.trim());

    const mappedFrame1 = await enhanceFrameWithSourceMaps(
      frame1,
      indexSourceMap
    );
    const mappedFrame2 = await enhanceFrameWithSourceMaps(
      frame2,
      indexSourceMap
    );

    expect(mappedFrame1).toMatch('__fixtures__/nestedCrashFn.esm.js:4:13');
    expect(mappedFrame2).not.toMatch('null');
    // TODO: figure out what is wrong with source maps
    // expect(mappedFrame1).toMatch('__fixtures__/crashFn.async.js:5:5');
  });
});
