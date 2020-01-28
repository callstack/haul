const terser = require('terser');

type Code =
  | string
  | string[]
  | {
      [file: string]: string;
    };

type Options =
  | {
      compress?: boolean | object;
      ecma?: any;
      ie8?: boolean;
      keep_classnames?: boolean | RegExp;
      keep_fnames?: boolean | RegExp;
      mangle?: boolean | object;
      module?: boolean;
      nameCache?: object;
      output?: any;
      parse?: any;
      safari10?: boolean;
      sourceMap?: boolean | object;
      toplevel?: boolean;
      warnings?: boolean | 'verbose';
    }
  | undefined;

export const minify = async (code: Code, minifyOptions: Options) =>
  terser.minify(code, minifyOptions);
