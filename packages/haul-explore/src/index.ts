import yargs from 'yargs';
import {
  explore,
  writeHtmlToTempFile,
  ExploreOptions,
} from 'source-map-explorer';
import sourceMapForRamBundle from './ram-bundle';
// eslint-disable-next-line import/no-extraneous-dependencies
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
const options: ExploreOptions = {
  output: {
    format:
      typeof argv.json === 'string'
        ? 'json'
        : typeof argv.tsv === 'string'
        ? 'tsv'
        : 'html',
  },
};

try {
  const bundleFile = fs.readFileSync(bundle);
  new RamBundleParser(bundleFile);
  sourceMapForRamBundle(bundle, sourceMap, options, false);
} catch (err) {
  if (path.basename(bundle) === 'UNBUNDLE') {
    sourceMapForRamBundle(bundle, sourceMap, options, true);
  } else {
    explore([bundle, sourceMap], options)
      .then(result => {
        return writeHtmlToTempFile(result.output);
      })
      .catch(err => {
        console.log(err);
        process.exit(1);
      });
  }
}
