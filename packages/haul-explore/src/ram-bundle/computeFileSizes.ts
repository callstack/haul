// eslint-disable-next-line import/no-extraneous-dependencies
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import { FileSizes } from 'source-map-explorer';
import fs from 'fs';
import path from 'path';

export const UNMAPPED_KEY = '[unmapped]';
export const NO_SOURCE_KEY = '[no source]';

type SourceMapData = {
  codeFileContent: string;
  consumer: any;
};
type FileDataMap = {
  [key: string]: {
    size: number;
  };
};

export function computeFileSizes(
  sourceMapData: SourceMapData,
  bundlePath: string,
  splitted: boolean
): FileSizes {
  const { consumer } = sourceMapData;

  const bundle = fs.readFileSync(bundlePath);
  const parser = splitted ? null : new RamBundleParser(bundle);

  let files: FileDataMap = {};
  let mappedBytes = 0;
  const bundleDirnamePath = path.dirname(bundlePath);
  consumer._sections.map((section: any) => {
    const line = section.generatedOffset.generatedLine - 1;
    const source = section.consumer._sources.size()
      ? section.consumer._sources.at(0)
      : NO_SOURCE_KEY;
    const moduleCode = splitted
      ? fs.readFileSync(path.join(bundleDirnamePath, `${line}.js`))
      : parser?.getModule(line);
    const rangeByteLength = moduleCode ? Buffer.byteLength(moduleCode) : 0;
    if (!files[source]) {
      files[source] = { size: 0 };
    }
    files[source].size += rangeByteLength;

    mappedBytes += rangeByteLength;
  });

  const totalBytes = mappedBytes;
  const unmappedBytes = totalBytes - mappedBytes;
  const eolBytes = 0;
  const sourceMapCommentBytes = 0;

  files[UNMAPPED_KEY] = { size: unmappedBytes };

  return {
    totalBytes,
    mappedBytes,
    unmappedBytes,
    files,
    eolBytes,
    sourceMapCommentBytes,
  };
}
