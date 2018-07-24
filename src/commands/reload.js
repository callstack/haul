/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Command } from '../types';

const clear = require('clear');
const logger = require('../logger');
const http = require('http');
const { DEFAULT_PORT } = require('../constants');

/**
 * Send reload request to devices
 */

async function reload(opts: *) {
  const requestOptions = {
    hostname: 'localhost',
    port: opts.port,
    path: '/reloadapp',
    method: 'HEAD',
  };

  const req = http.request(requestOptions, () => {
    clear();
    logger.done('Sent reload request');
    req.end();
  });

  req.on('error', e => {
    clear();
    const error = e.toString();
    if (error.includes('connect ECONNREFUSED')) {
      logger.error(`Reload request failed. Make sure Haul is up.`);
    } else {
      logger.error(e);
    }
  });

  req.end();
}

module.exports = ({
  name: 'reload',
  description: 'Sends reload request to all devices that enabled live reload',
  action: reload,
  options: [
    {
      name: 'port',
      description: 'Port your webpack server is running on',
      default: DEFAULT_PORT,
      parse: Number,
    },
  ],
}: Command);
