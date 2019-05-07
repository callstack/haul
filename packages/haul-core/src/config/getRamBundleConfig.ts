import { ProjectConfig, RamBundleConfig } from './types';

export default function getRamBundleConfig(
  projectConfig: ProjectConfig
): RamBundleConfig {
  const { ramBundle } = projectConfig;
  return ramBundle || {};
}
