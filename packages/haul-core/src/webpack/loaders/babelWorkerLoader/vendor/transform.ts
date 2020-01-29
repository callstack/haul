import * as babel from '@babel/core';
import promisify from 'pify';

import LoaderError from './error';

const transform = promisify(babel.transform);

export default async function(
  source: string,
  options: babel.TransformOptions | undefined
) {
  let result;
  try {
    result = await transform(source, options);
  } catch (err) {
    throw err.message && err.codeFrame ? new LoaderError(err) : err;
  }

  if (!result) return null;

  const { ast, code, map, metadata, sourceType } = result;

  if (map?.sourcesContent?.length) {
    map.sourcesContent = [source];
  }

  return { ast, code, map, metadata, sourceType };
};

export const version = babel.version;
