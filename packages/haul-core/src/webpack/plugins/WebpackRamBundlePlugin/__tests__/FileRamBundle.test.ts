import { RawSource } from 'webpack-sources';
import MAGIC_NUMBER from 'metro/src/shared/output/RamBundle/magic-number';
import FileRamBundle from '../FileRamBundle';

test('FileRamBundle should create valid RAM bundle', () => {
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

  const compilation = { assets: {} as { [key: string]: RawSource } };
  const ramBundle = new FileRamBundle(
    bootstrapper,
    modules,
    false,
    'index',
    true
  );
  ramBundle.build({
    outputDest: '',
    outputFilename: 'main.jsbundle',
    sourceMapFilename: 'main.jsbundle.map',
    compilation: compilation as any,
  });
  expect(compilation.assets['main.jsbundle'].source()).toEqual(bootstrapper);
  const UNBUNDLE: Buffer = compilation.assets[
    'js-modules/UNBUNDLE'
  ].source() as any;
  const magicNumber = UNBUNDLE.readUInt32LE(0);
  expect(magicNumber).toEqual(MAGIC_NUMBER);
  expect(compilation.assets['js-modules/0.js'].source()).toEqual(
    modules[0].source
  );
  expect(compilation.assets['js-modules/1.js'].source()).toEqual(
    modules[1].source
  );
});
