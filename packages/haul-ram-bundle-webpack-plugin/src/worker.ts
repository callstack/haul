import terser from 'terser';

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
