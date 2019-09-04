export function assertBundles(bundles: {
  baseDll: string;
  host: string;
  app0: string;
}) {
  expect(bundles.baseDll).toMatch('this["base_dll"] =');
  expect(bundles.baseDll).toMatch('node_modules/react');
  expect(bundles.baseDll).toMatch('node_modules/react-native');
  expect(bundles.baseDll).toMatch('module.exports = __webpack_require__;');

  expect(bundles.host).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.host).toMatch('dll-reference base_dll');
  expect(bundles.host).toMatch('./host.js');
  expect(bundles.host).toMatch('BundleRegistry');

  expect(bundles.app0).toMatch('this["app0"] =');
  expect(bundles.app0).toMatch(
    'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true); }'
  );
  expect(bundles.app0).toMatch('dll-reference base_dll');
  expect(bundles.app0).toMatch('./App.js');
}
