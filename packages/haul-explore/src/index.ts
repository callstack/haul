import yargs from 'yargs';
import {
  explore,
  writeHtmlToTempFile,
  ExploreOptions,
  ExploreResult,
} from 'source-map-explorer';
import sourceMapForRamBundle from './ram-bundle';
import RamBundleParser from 'metro/src/lib/RamBundleParser';
import path from 'path';

import fs from 'fs';

const argv = yargs
  .strict()
  .scriptName('explore')
  .demandCommand(2, 'bundle and source map files must be specified')
  .options({
    json: {
      type: 'string',
      description:
        'If filename specified save output as JSON to specified file otherwise output to stdout.',
      conflicts: ['tsv', 'html'],
    },
    tsv: {
      type: 'string',
      description:
        'If filename specified save output as TSV to specified file otherwise output to stdout.',
      conflicts: ['json', 'html'],
    },
    html: {
      type: 'string',
      description:
        'If filename specified save output as HTML to specified file otherwise output to stdout rather than opening a browser.',
      conflicts: ['json', 'tsv'],
    },
  })
  .group(['json', 'tsv', 'html'], 'Output:')
  .parse();

const bundle = path.resolve(argv._[0]);
const sourceMap = path.resolve(argv._[1]);
const outputFormat =
  typeof argv.json === 'string'
    ? 'json'
    : typeof argv.tsv === 'string'
    ? 'tsv'
    : 'html';
const options: ExploreOptions = {
  output: {
    format: outputFormat,
  },
};
const outputFile = argv[outputFormat] || '';

(async () => {
  try {
    const bundleFile = fs.readFileSync(bundle);
    new RamBundleParser(bundleFile);
    const results = await sourceMapForRamBundle(
      bundle,
      sourceMap,
      options,
      false
    );
    writeResults(results);
  } catch (err) {
    const unbundleFilePath = path.join(
      path.dirname(bundle),
      'js-modules/UNBUNDLE'
    );
    if (fs.existsSync(unbundleFilePath)) {
      const results = await sourceMapForRamBundle(
        bundle,
        sourceMap,
        options,
        true
      );
      writeResults(results);
    } else {
      const results = await explore([bundle, sourceMap], options);
      writeResults(results);
    }
  }
})().catch(error => {
  console.log(error);
  process.exit(1);
});

function writeResults(result: ExploreResult) {
  if (outputFile.length > 0) {
    fs.writeFileSync(outputFile, result.output);
  } else {
    writeHtmlToTempFile(result.output);
  }
}
