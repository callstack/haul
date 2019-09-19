// eslint-disable-next-line import/no-extraneous-dependencies
import RamBundleParser from 'metro/src/lib/RamBundleParser';

export function validateBaseBundle(bundleBuffer: Buffer) {
  const parser = new RamBundleParser(bundleBuffer);
  expect(parser.getStartupCode().length).toBeGreaterThan(0);
  const [, mainModuleId] = parser
    .getStartupCode()
    .match(/mainModuleId: (\d+)/) || ['', '-1'];
  expect(parser.getModule(parseInt(mainModuleId, 10)).length).toBeGreaterThan(
    0
  );
  expect(bundleBuffer.toString().includes('react-native-windows')).toBe(true);
  expect(bundleBuffer.toString().includes("OS: 'windows',")).toBe(true);
}

export function validateHostBundle(bundleBuffer: Buffer) {
  expect(
    bundleBuffer
      .toString()
      .includes(
        'if (!this["base_dll"]) { this.bundleRegistryLoad("base_dll", true, true);'
      )
  ).toBe(true);
  expect(bundleBuffer.toString().includes('BundleRegistry')).toBe(true);
}

export function validateAppBundle(bundleBuffer: Buffer) {
  const parser = new RamBundleParser(bundleBuffer);
  expect(parser.getStartupCode().length).toBeGreaterThan(0);
  const [, mainModuleId] = parser
    .getStartupCode()
    .match(/mainModuleId: (\d+)/) || ['', '-1'];
  expect(parser.getModule(parseInt(mainModuleId, 10)).length).toBeGreaterThan(
    0
  );
  expect(
    bundleBuffer.toString().includes("preloadBundleNames: [ 'base_dll' ]")
  ).toBe(true);
}
