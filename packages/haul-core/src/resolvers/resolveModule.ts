import path from 'path';
import fs from 'fs';
import resolver from 'resolve';

/**
 * Resolves the real path to a given module
 * We point to 'package.json', then remove it to receive a path to the directory itself
 */
export default function resolveModule(root: string, name: string): string {
  const filePath = resolver.sync(`${name}/package.json`, { basedir: root });
  const realPath = fs.realpathSync(filePath);
  return path.dirname(realPath);
}
