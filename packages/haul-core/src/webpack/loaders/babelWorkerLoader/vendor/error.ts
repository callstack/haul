const STRIP_FILENAME_RE = /^[^:]+: /;

const format = (err: {
  name: null | string;
  message: string;
  hideStack: boolean;
  codeFrame: any;
}) => {
  if (err instanceof SyntaxError) {
    err.name = 'SyntaxError';
    err.message = err.message.replace(STRIP_FILENAME_RE, '');

    err.hideStack = true;
  } else if (err instanceof TypeError) {
    // @ts-ignore null is not assignable to string
    err.name = null;
    err.message = err.message.replace(STRIP_FILENAME_RE, '');

    err.hideStack = true;
  }

  return err;
};

export default class LoaderError extends Error {
  constructor(err: any) {
    super();

    const { name, message, codeFrame, hideStack } = format(err);

    this.name = 'BabelLoaderError';

    this.message = `${name ? `${name}: ` : ''}${message}\n\n${codeFrame}\n`;
    // @ts-ignore Property 'hideStack' does not exist on type 'LoaderError'.
    // Redeclaring hideStack could break the scope.
    this.hideStack = hideStack;

    Error.captureStackTrace(this, this.constructor);
  }
}

