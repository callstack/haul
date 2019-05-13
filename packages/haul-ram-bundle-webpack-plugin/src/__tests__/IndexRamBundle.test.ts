import RamBundleParser from 'metro/src/lib/RamBundleParser';
import IndexRamBundle from '../IndexRamBundle';

test('IndexRamBundle should create valid RAM bundle', () => {
  const bootstrapper = '(function() { /* bootstrap */ })()';
  const modules = [
    {
      id: 0,
      idx: 0,
      filename: 'index.js',
      source: 'sr(0, (function m0() { })',
      map: {},
    },
    {
      id: 1,
      idx: 1,
      filename: 'module1.js',
      source: 'sr(1, (function m1() { })',
      map: {},
    },
  ];

  const compilation = { assets: {} };
  const ramBundle = new IndexRamBundle(bootstrapper, modules, false);
  ramBundle.build({
    outputDest: '',
    outputFilename: 'main.jsbundle',
    compilation: compilation as any,
  });
  expect(compilation.assets['main.jsbundle'].source().length).toBeGreaterThan(
    0
  );

  const parser = new RamBundleParser(
    Buffer.from(compilation.assets['main.jsbundle'].source())
  );
  expect(parser.getStartupCode()).toEqual(bootstrapper);
  expect(parser.getModule(0)).toEqual(modules[0].source);
  expect(parser.getModule(1)).toEqual(modules[1].source);
});
