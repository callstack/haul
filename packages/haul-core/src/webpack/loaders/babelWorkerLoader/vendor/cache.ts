import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import mkdirpOrig from 'mkdirp';
import findCacheDir from 'find-cache-dir';
import promisify from 'pify';

import transform from './transform';

let defaultCacheDirectory: string | null = null;

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const gunzip = promisify(zlib.gunzip);
const gzip = promisify(zlib.gzip);
const mkdirp = promisify(mkdirpOrig);

const read = async function(filename: string | number, compress: any) {
  const data = await readFile(filename + (compress ? '.gz' : ''));
  const content = compress ? await gunzip(data) : data;

  return JSON.parse(content.toString());
};

const write = async function(
  filename: string | number,
  compress: any,
  result: any
) {
  const content = JSON.stringify(result);

  const data = compress ? await gzip(content) : content;
  return await writeFile(filename + (compress ? '.gz' : ''), data);
};

const filename = (source: any, identifier: any, options: any) => {
  const hash = crypto.createHash('md4');
  const contents = JSON.stringify({ source, options, identifier });

  hash.update(contents);

  return hash.digest('hex') + '.json';
};

type handleCacheParams = {
  source: any;
  options?: {} | undefined;
  cacheIdentifier: any;
  cacheDirectory: any;
  cacheCompression: any;
};

const handleCache = async function(
  directory: string,
  params: handleCacheParams
): Promise<any> {
  const {
    source,
    options = {},
    cacheIdentifier,
    cacheDirectory,
    cacheCompression,
  } = params;

  const file = path.join(directory, filename(source, cacheIdentifier, options));

  try {
    // No errors mean that the file was previously cached
    // we just need to return it
    return await read(file, cacheCompression);
    // eslint-disable-next-line no-empty
  } catch (err) {}

  const fallback =
    typeof cacheDirectory !== 'string' && directory !== os.tmpdir();

  try {
    await mkdirp(directory);
  } catch (err) {
    if (fallback) {
      return handleCache(os.tmpdir(), params);
    }

    throw err;
  }

  // Otherwise just transform the file
  // return it to the user asap and write it in cache
  const result = await transform(source, options);

  try {
    await write(file, cacheCompression, result);
  } catch (err) {
    if (fallback) {
      // Fallback to tmpdir if node_modules folder not writable
      return handleCache(os.tmpdir(), params);
    }

    throw err;
  }

  return result;
};

export default async function(params: handleCacheParams) {
  if(typeof params.cacheDirectory !== 'string' && defaultCacheDirectory === null) {
    defaultCacheDirectory =
        findCacheDir({ name: 'babel-loader' }) || os.tmpdir();
  }
  const directory = params.cacheDirectory || defaultCacheDirectory

  return await handleCache(directory, params);
};
