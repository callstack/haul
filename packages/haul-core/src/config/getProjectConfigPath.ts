import path from 'path';
import { DEFAULT_CONFIG_FILENAME } from '../constants';

export default function getProjectConfigPath(
  root: string,
  configPath?: string
) {
  return configPath
    ? path.isAbsolute(configPath)
      ? configPath
      : path.join(root, configPath)
    : path.join(root, DEFAULT_CONFIG_FILENAME);
}
