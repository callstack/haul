import terser from 'terser';
import { promisify } from 'util';

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
