import {
  loadSourceMap,
  adjustSourcePaths,
  getExploreResult,
  saveOutputToFile,
  writeHtmlToTempFile,
  ExploreOptions,
} from 'source-map-explorer';
import path from 'path';
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
          bundleName:
            path.basename(bundle) === 'UNBUNDLE'
              ? 'index.android.bundle'
              : path.basename(bundle),
          files,
        },
      ];
      const result = getExploreResult(bundles, options);
      saveOutputToFile(result, options);
      return writeHtmlToTempFile(result.output);
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
}
