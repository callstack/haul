import fs from 'fs';

export function kilobytes(value: number) {
  return value * 1024;
}

export function validateBundleSize(
  bundlePath: string,
  min: number,
  max: number
) {
  const stats = fs.statSync(bundlePath);
  expect(stats.isFile()).toBe(true);
  expect(stats.size).toBeGreaterThan(min);
  expect(stats.size).toBeLessThan(max);
}
