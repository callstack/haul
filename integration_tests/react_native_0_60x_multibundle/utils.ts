export function assertBundles(
  bundles: {
    baseDll: string;
    host: string;
    app0: string;
    app1: string;
    app1Chunk?: string;
  },
  staticBundles = false
) {
  expect(bundles.baseDll).toMatch('this["base_dll"] =');
  expect(bundles.baseDll).toMatch('node_modules/react');
  expect(bundles.baseDll).toMatch('node_modules/react-native');
  expect(bundles.baseDll).toMatch('BundleRegistry');
  expect(bundles.baseDll).toMatch('module.exports = __webpack_require__;');

  expect(bundles.host).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.host).toMatch('dll-reference base_dll');
  expect(bundles.host).toMatch('./src/host.js');

  expect(bundles.app0).toMatch('this["app0"] =');
  expect(bundles.app0).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.app0).toMatch('dll-reference base_dll');
  expect(bundles.app0).toMatch('./src/app0');

  expect(bundles.app1).toMatch('this["app1"] =');
  expect(bundles.app1).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.app1).toMatch('dll-reference base_dll');
  expect(bundles.app1).toMatch('./src/app1');
  if (staticBundles) {
    expect(bundles.app1).toMatch('throw new Error("Invalid bundle');
  } else {
    expect(bundles.app1).toMatch('function asyncEval');
    expect(bundles.app1).toMatch(
      /return asyncEval\(__webpack_require__\.p \+ "" \+ chunkId \+ "\.app1\.(ios|android)\.bundle"\);/g
    );

    expect(bundles.app1Chunk).toMatch('this["webpackChunkapp1"]');
    expect(bundles.app1Chunk).toMatch('./src/async.js');
    expect(bundles.app1Chunk).not.toMatch('base_dll');
  }
}
