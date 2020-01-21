import {
  loadSourceMap,
  adjustSourcePaths,
  getExploreResult,
  saveOutputToFile,
  writeHtmlToTempFile,
  ExploreOptions,
} from 'source-map-explorer';
import { computeFileSizes } from './computeFileSizes';

export default function sourceMapForRamBundle(
  bundle: string,
  sourceMap: string,
  options: ExploreOptions,
  splitted: boolean
) {
  loadSourceMap(bundle, sourceMap)
    .then(sourceMapData => {
      const sizes = computeFileSizes(sourceMapData, bundle, splitted);
      const files = adjustSourcePaths(sizes.files, options);
      const bundles = [
        {
          ...sizes,
          bundleName: 'index.android.bundle',
          files,
        },
      ];
      const result = getExploreResult(bundles, options);
      saveOutputToFile(result, options);
      return writeHtmlToTempFile(result.output);
    })
    .catch(err => console.log(err));
}
