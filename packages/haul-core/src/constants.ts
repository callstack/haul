import { join } from 'path';

export const INTERACTIVE_MODE_DEFAULT = true;
export const DEFAULT_CONFIG_FILENAME = 'haul.config.js';
export const DEFAULT_PORT = 8081;
export const ASSET_LOADER_PATH = join(
  __dirname,
  './webpack/loaders/assetLoader'
);
