const format = (err: {
  name: null | string;
  message: string;
  hideStack: boolean;
  codeFrame: any;
}) => ({
    ...err, 
    name: err instanceof SyntaxError ? 'SyntaxError' : '',
    message: err.message.replace(/^[^:]+: /, ''),
    hideStack: true
  })

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

