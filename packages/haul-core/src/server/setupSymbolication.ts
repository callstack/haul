import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import Runtime from '../runtime/Runtime';
import { SourceMapConsumer } from 'source-map';
import fetch from 'node-fetch';

type ReactNativeStackFrame = {
  lineNumber: number;
  column: number;
  file: string;
  methodName: string;
};

type ReactNativeStack = Array<ReactNativeStackFrame>;

type ReactNativeSymbolicatePayload = {
  stack: ReactNativeStack;
};

/**
 * Creates a SourceMapConsumer so we can query it.
 */
async function createSourceMapConsumer(runtime: Runtime, url: string) {
  const response = await fetch(url);
  const sourceMap = await response.text();

  // we stop here if we couldn't find that map
  if (!sourceMap) {
    runtime.logger.warn('Unable to find source map.');
    return null;
  }

  // feed the raw source map into our consumer
  try {
    return new SourceMapConsumer(sourceMap);
  } catch (err) {
    runtime.logger.error('There was a problem reading the source map', err);
    return null;
  }
}

/**
 * Gets the stack frames that React Native wants us to convert.
 */
function getRequestedFrames(
  payload: ReactNativeSymbolicatePayload
): ReactNativeStack | null {
  const stack = payload.stack;
  if (!stack) return null;

  const newStack = stack.filter(stackLine => {
    const { methodName } = stackLine;
    const unwantedStackRegExp = new RegExp(
      /(__webpack_require__|haul|eval(JS){0,1})/
    );

    if (unwantedStackRegExp.test(methodName)) return false; // we don't need those

    const evalLine = methodName.indexOf('Object../');
    if (evalLine > -1) {
      const newMethodName = methodName.slice(evalLine + 9); // removing this prefix in method names
      stackLine.methodName = newMethodName; // eslint-disable-line
    }
    return true;
  });

  return newStack;
}

export default function setupSymbolication(
  runtime: Runtime,
  server: Hapi.Server
) {
  server.route({
    method: 'POST',
    path: '/symbolicate',
    options: {
      validate: {
        payload: {
          stack: Joi.array().items(Joi.any()),
        },
      },
    },
    handler: async (request, h) => {
      // grab the source stack frames
      const unconvertedFrames = getRequestedFrames(
        request.payload as ReactNativeSymbolicatePayload
      );
      if (!unconvertedFrames || unconvertedFrames.length === 0) {
        return h.response().code(400);
      }

      // grab the platform and filename from the first frame (e.g. index.ios.bundle?platform=ios&dev=true&minify=false:69825:16)
      const filenameMatch = unconvertedFrames[0].file.match(/\/(\D+)\?/);
      const platformMatch = unconvertedFrames[0].file.match(
        /platform=([a-zA-Z]*)/
      );

      const filename: string | null = filenameMatch && filenameMatch[1];
      const platform: string | null = platformMatch && platformMatch[1];

      if (!filename || !platform) {
        return h.response().code(400);
      }

      const [name, ...rest] = filename.split('.');
      const bundleName = `${name}.${platform}.${rest[rest.length - 1]}`;

      // grab our source map consumer
      const consumer = await createSourceMapConsumer(
        runtime,
        `http://localhost:${request.info.host.split(':')[1]}/${bundleName}.map`
      );

      if (!consumer) {
        return h.response().code(500);
      }

      // the base directory
      // const root = getConfig(configPath, configOptions, platform).context;
      let convertedFrames: ReactNativeStackFrame[] = [];
      try {
        // error error on the wall, who's the fairest stack of all?
        convertedFrames = unconvertedFrames.map(
          (originalFrame): ReactNativeStackFrame => {
            if (
              originalFrame.lineNumber === null ||
              originalFrame.column === null
            ) {
              return originalFrame;
            }

            // find the original home of this line of code.
            const lookup = consumer.originalPositionFor({
              line: originalFrame.lineNumber,
              column: originalFrame.column,
            });

            // If lookup fails, we get the same shape object, but with
            // all values set to null
            if (lookup.source == null) {
              // It is better to gracefully return the original frame
              // than to throw an exception
              return originalFrame;
            }

            // convert these to a format which React Native wants
            return {
              lineNumber: lookup.line || originalFrame.lineNumber,
              column: lookup.column || originalFrame.column,
              file: lookup.source,
              methodName: originalFrame.methodName,
            };
          }
        );
      } catch (error) {
        runtime.logger.error(error);
      }

      // send it back to React Native
      return { stack: convertedFrames };
    },
  });
}
