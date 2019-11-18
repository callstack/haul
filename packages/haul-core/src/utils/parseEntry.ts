import webpack from 'webpack';
import path from 'path';

const resolvePath = (relativeFilePathArray: string[]) =>
  relativeFilePathArray.map(entry => path.resolve(process.cwd(), entry));

function parseMultipleEntries(entry: webpack.Entry | string[]) {
  if (Array.isArray(entry)) {
    return resolvePath(entry);
  }

  if (typeof entry === 'object' && entry !== null) {
    return Object.keys(entry).reduce(
      (fileArray, key) => {
        const filesForEntry = entry[key];
        if (typeof filesForEntry === 'string') {
          fileArray.push(filesForEntry);
          return fileArray;
        }

        fileArray.push(`(chunk: ${key})`, ...resolvePath(filesForEntry));
        return fileArray;
      },
      [] as string[]
    );
  }

  return entry;
}

export default function parseEntry(entry: webpack.Configuration['entry']) {
  if (typeof entry === 'string') {
    return path.join(process.cwd(), entry);
  }
  if (Array.isArray(entry) || (typeof entry === 'object' && entry !== null)) {
    return parseMultipleEntries(entry).join('\n');
  }

  return entry;
}
