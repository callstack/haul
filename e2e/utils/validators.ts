// eslint-disable-next-line import/no-extraneous-dependencies
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import fetch from 'node-fetch';

type ValidationOptions = {
  isIndexedRAMBundle?: boolean;
  platform?: string;
};

export function validateBaseBundle(
  bundleBuffer: Buffer,
  options: ValidationOptions = {}
) {
  if (options.isIndexedRAMBundle) {
    const parser = new RamBundleParser(bundleBuffer);
    expect(parser.getStartupCode().length).toBeGreaterThan(0);
    const [, mainModuleId] = parser
      .getStartupCode()
      .match(/mainModuleId: (\d+)/) || ['', '-1'];
    expect(parser.getModule(parseInt(mainModuleId, 10)).length).toBeGreaterThan(
      0
    );
  }
  if (options.platform === 'windows') {
    expect(bundleBuffer.toString().includes('react-native-windows')).toBe(true);
    expect(bundleBuffer.toString().includes("OS: 'windows',")).toBe(true);
  } else if (options.platform) {
    expect(bundleBuffer.toString().includes('react-native')).toBe(true);
    expect(bundleBuffer.toString().includes(`OS: '${options.platform}',`)).toBe(
      true
    );
  }
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

export function validateAppBundle(
  bundleBuffer: Buffer,
  options: ValidationOptions = {}
) {
  if (options.isIndexedRAMBundle) {
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
  expect(bundleBuffer.toString()).toMatch(/this\["\w+"\] =/);
}

export function validateAppBundleWithChunk(
  bundleBuffer: Buffer,
  chunkBuffer: Buffer
) {
  const bundle = bundleBuffer.toString();
  expect(bundle).toMatch('function asyncEval');
  expect(bundle).toMatch(
    /return asyncEval\(__webpack_require__\.p \+ "" \+ chunkId \+ "\.app1\.(ios|android)\.bundle"\);/g
  );

  const chunk = chunkBuffer.toString();
  expect(chunk).toMatch('this["webpackChunkapp1"]');
  expect(chunk).toMatch('./src/async.js');
  expect(chunk).not.toMatch('base_dll');
}

export async function fetchAndValidateBundle(url: string) {
  const res = await fetch(url);
  const bundle = await res.text();
  expect(bundle).toMatch('__webpack_require__');
}
