import terser from 'terser';
import fs, { readFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

type Code =
  | string
  | string[]
  | {
      [file: string]: string;
    }
  | terser.AST_Node;

type Options = terser.MinifyOptions | undefined;

export const minify = async (filename: string, minifyOptions: Options) => {
  const code = await readFile(filename, 'utf8');
  const m = terser.minify(code, minifyOptions);
  await writeFile(filename, m.code);
};
