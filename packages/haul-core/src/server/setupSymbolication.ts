import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import Runtime from '../runtime/Runtime';
import { SourceMapConsumer } from 'source-map';
import fetch from 'node-fetch';
import getBundleDataFromURL from '../utils/getBundleDataFromURL';

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

type SourceMapConsumers = {
  [platform: string]: {
    [bundleName: string]: SourceMapConsumer | undefined;
  };
};

let sourceMapConsumers: SourceMapConsumers = {};

async function getSourceMapConsumers(
  runtime: Runtime,
  platform: string,
  bundleNames: string[],
  baseUrl: string
): Promise<SourceMapConsumers> {
  if (!sourceMapConsumers[platform]) {
    // eslint-disable-next-line require-atomic-updates
    sourceMapConsumers[platform] = (await Promise.all(
      bundleNames.map(bundleName =>
        createSourceMapConsumer(
          runtime,
          `${baseUrl}${bundleName}.${platform}.bundle.map`
        )
      )
    )).reduce(
      (acc, sourceMapConsumer, index) => ({
        ...acc,
        [bundleNames[index]]: sourceMapConsumer,
      }),
      {}
    );

    runtime.logger.info(
      `Source map consumers for ${platform} bundles: ${bundleNames.join(
        ', '
      )} created`
    );
  }

  return sourceMapConsumers;
}

/**
 * Creates a SourceMapConsumer so we can query it.
 */
async function createSourceMapConsumer(runtime: Runtime, url: string) {
  const response = await fetch(url);
  const sourceMap = await response.text();

  // we stop here if we couldn't find that map
  if (!sourceMap) {
    runtime.logger.warn('Unable to find source map.');
    return undefined;
  }

  // feed the raw source map into our consumer
  try {
    return new SourceMapConsumer(sourceMap);
  } catch (err) {
    runtime.logger.error('There was a problem reading the source map', err);
    return undefined;
  }
}

export default function setupSymbolication(
  runtime: Runtime,
  server: Hapi.Server,
  { bundleNames }: { bundleNames: string[] }
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
        runtime.logger.warn('Cannot symbolicate an empty stack frames');
        return h.response().code(400);
      }

      const { platform } = getBundleDataFromURL(unconvertedFrames[0].file);
      if (!platform) {
        runtime.logger.warn(
          `Cannot detect platform from initial frame: ${unconvertedFrames[0].file}`
        );
        return h.response().code(400);
      }

      // grab our source map consumer
      const consumers = await getSourceMapConsumers(
        runtime,
        platform,
        bundleNames,
        `http://localhost:${request.info.host.split(':')[1]}/`
      );

      if (!consumers || !consumers[platform]) {
        runtime.logger.error('No source map consumers were created');
        return h.response().code(500);
      }

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

            const { name: bundleName } = getBundleDataFromURL(
              originalFrame.file
            );
            if (!bundleName) {
              return originalFrame;
            }

            const targetConsumer = consumers[platform][bundleName];
            if (!targetConsumer) {
              runtime.logger.warn(
                `SourceMapConsumer for ${bundleName} was not initialized`
              );
              return originalFrame;
            }

            // find the original home of this line of code.
            const lookup = targetConsumer.originalPositionFor({
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
