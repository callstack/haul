import fs from 'fs';
import path from 'path';

export default function getBabelConfigPath(cwd: string): string | undefined {
  const babelConfigPath = path.join(cwd, 'babel.config.js');
  const babelrcPath = path.join(cwd, '.babelrc');

  if (fs.existsSync(babelConfigPath)) {
    return babelConfigPath;
  }

  if (fs.existsSync(babelrcPath)) {
    return babelrcPath;
  }
}
