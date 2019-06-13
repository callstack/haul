import { NormalizedProjectConfig } from '../config/types';

export default function sortBundlesByDependencies(
  projectConfig: NormalizedProjectConfig
): string[] {
  const dlls: Set<string> = new Set();
  let host: string = '';
  const apps: string[] = [];

  const addDllDependencies = (deps: string[]) => {
    deps.forEach(depName => {
      addDllDependencies(projectConfig.bundles[depName].dependsOn);
      dlls.add(depName);
    });
  };

  for (const bundleName in projectConfig.bundles) {
    const { dll, dependsOn } = projectConfig.bundles[bundleName];
    if (dll) {
      addDllDependencies(dependsOn);
      dlls.add(bundleName);
    } else if (bundleName === 'index' || bundleName === 'host') {
      host = bundleName;
    } else {
      apps.push(bundleName);
    }
  }

  if (!host) {
    throw new Error(
      'Cannot find webpack config `index` nor `host`. Make sure you have bundle config for `index` or `host'
    );
  }

  return [...dlls.values(), host, ...apps];
}
