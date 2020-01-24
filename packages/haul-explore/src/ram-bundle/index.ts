import {
  loadSourceMap,
  adjustSourcePaths,
  getExploreResult,
  ExploreOptions,
} from 'source-map-explorer';
import path from 'path';
import { computeFileSizes } from './computeFileSizes';

export default async function sourceMapForRamBundle(
  bundle: string,
  sourceMap: string,
  options: ExploreOptions,
  splitted: boolean
) {
  const sourceMapData = await loadSourceMap(bundle, sourceMap);
  const sizes = computeFileSizes(sourceMapData, bundle, splitted);
  const files = adjustSourcePaths(sizes.files, options);
  const bundles = [
    {
      ...sizes,
      bundleName: path.basename(bundle),
      files,
    },
  ];
  const result = getExploreResult(bundles, options);
  return result;
}
