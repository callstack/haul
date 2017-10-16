/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 * global WebSocket, MessageEvent
 */

const processUpdate = require('webpack-hot-middleware/process-update');

function normalizeOptions({ path, quiet, overlay, reload, name }) {
  const shouldLog = !quiet;
  const options = {
    path,
    overlay: true,
    reload: false,
    name: '',
    logger: {
      shouldLog,
      log(...args) {
        if (shouldLog) {
          console.log(...args);
        }
      },
      warn(...args) {
        if (shouldLog) {
          console.warn(...args);
        }
      },
      error(...args) {
        if (shouldLog) {
          console.error(...args);
        }
      },
    },
  };

  if (overlay) {
    options.overlay = overlay !== 'false';
  }
  if (reload) {
    options.reload = reload !== 'false';
  }
  if (name) {
    options.name = name;
  }
  return options;
}

function processPayload(payload, { logger, reporter, ...opts }) {
  switch (payload.action) {
    case 'building':
      logger.log(
        `[Haul HMR] Bundle ${payload.name
          ? `'${payload.name}' `
          : ''}rebuilding`
      );
      break;
    case 'built':
      logger.log(
        `[Haul HMR] Bundle ${payload.name
          ? `'${payload.name}' `
          : ''}rebuilt in ${payload.time}ms`
      );
    // fall through
    case 'sync':
      if (payload.name && opts.name && payload.name !== opts.name) {
        return;
      }

      if (payload.errors.length > 0 && reporter) {
        reporter.problems('errors', payload);
      } else if (payload.warnings.length > 0 && reporter) {
        reporter.problems('warnings', payload);
      } else if (reporter) {
        reporter.cleanProblemsCache();
        reporter.success();
      }

      processUpdate(payload.hash, payload.modules, {
        ...opts,
        log: logger.shouldLog,
        warn: logger.shouldLog,
        error: logger.shouldLog,
      });
      break;
    default:
      logger.warn(`[HMR] Invalid action ${payload.action}`);
  }
}

/**
 * Custom HMR client with WebSocket support instead of EventSource as `webpack-hot-middleware`
 */
module.exports = function connect(options: Object) {
  const { logger, ...opts } = normalizeOptions(options);
  const ws = new WebSocket(opts.path);

  ws.onopen = () => {
    logger.log(
      '[Haul HMR] Client connected, however until you `Enable Hot Reloading`, ' +
        'you will not get any updates'
    );
  };

  ws.onerror = error => {
    logger.error(
      `[Haul HMR] Client could not connect to the server ${opts.path}`,
      error
    );
  };

  ws.onmessage = (message: MessageEvent) => {
    if (typeof message.data !== 'string') {
      throw new Error(
        `[Haul HMR] Data from websocker#onmessage must be a string`
      );
    }
    const payload = JSON.parse(message.data);
    try {
      processPayload(payload, { logger, ...opts });
    } catch (error) {
      logger.warn(`[Haul HMR] Invalid message: ${payload}`, error);
    }
  };
};
