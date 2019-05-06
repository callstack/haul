import RamBundleParser from 'metro/src/lib/RamBundleParser';
import RamBundle from '../RamBundle';

test('RamBundle should create valid RAM bundle', () => {
  const bootstrapper = '(function() { /* bootstrap */ })()';
  const modules = [
    {
      id: 0,
      idx: 0,
      filename: 'index.js',
      source: 'sr(0, (function m0() { })',
    },
    {
      id: 1,
      idx: 1,
      filename: 'module1.js',
      source: 'sr(1, (function m1() { })',
    },
  ];

  const bundle = new RamBundle();
  const buffer = bundle.build(bootstrapper, modules);
  expect(buffer.length).toBeGreaterThan(0);

  const parser = new RamBundleParser(buffer);
  expect(parser.getStartupCode()).toEqual(bootstrapper);
  expect(parser.getModule(0)).toEqual(modules[0].source);
  expect(parser.getModule(1)).toEqual(modules[1].source);
});
