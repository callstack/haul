import path from 'path';
import fs from 'fs';
import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import launchBrowser from './launchBrowser';
import Runtime from '../runtime/Runtime';
import openInEditor from './openInEditor';
import { promisify } from 'util';

export default function setupDevtoolRoutes(
  runtime: Runtime,
  server: Hapi.Server,
  { isDebuggerConnected }: { isDebuggerConnected: () => boolean }
) {
  server.route({
    method: 'GET',
    path: '/launch-js-devtools',
    handler: request => {
      // Open debugger page only if it's not already open.
      if (!isDebuggerConnected()) {
        launchBrowser(
          runtime,
          `http://localhost:${request.raw.req.socket.localPort}/debugger-ui`
        );
      }
      return 'OK';
    },
  });

  server.route({
    method: 'POST',
    path: '/open-stack-frame',
    options: {
      validate: {
        payload: {
          file: Joi.string().required(),
          lineNumber: Joi.number().required(),
          column: Joi.number().required(),
          methodName: Joi.string().required(),
        },
      },
    },
    handler: async request => {
      const { file, lineNumber, column } = request.payload as {
        lineNumber: number;
        column: number;
        file: string;
      };
      const url = `${file}:${lineNumber}:${column}`;
      await openInEditor(runtime, url);

      return 'OK';
    },
  });

  server.route({
    method: 'POST',
    path: '/systrace',
    options: {
      payload: {
        output: 'data',
        parse: false,
      },
    },
    handler: async (request, h) => {
      const filename = `/tmp/haul_${Date.now()}.json`;
      const message = `We've saved the trace report at ${runtime.logger.enhanceWithModifier(
        'bold',
        filename
      )}\nYou can open the trace report in Google Chrome by navigating to 'chrome://tracing' and clicking 'load'.`;
      try {
        await promisify(fs.writeFile)(filename, request.payload);
        runtime.logger.info(message);
      } catch (error) {
        return h.response().code(200);
      }

      return message;
    },
  });

  server.route({
    method: 'GET',
    path: '/status',
    handler: () => 'packager-status:running',
  });

  server.route({
    method: 'GET',
    path: '/debugger-ui',
    handler: {
      file: {
        path: path.join(__dirname, '../../assets/debugger.html'),
        confine: false,
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/debugger-ui/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '../../assets'),
        redirectToSlash: true,
      },
    },
  });
}
