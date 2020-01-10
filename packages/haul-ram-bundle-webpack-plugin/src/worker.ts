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

export const minify = async (code: Code, minifyOptions: Options) => 
  terser.minify(code, minifyOptions);
