/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { Platform } from '../types';

const EventEmitter = require('events');
const Events = require('./events');
const Fork = require('./Fork');
const TaskQueue = require('./TaskQueue');

module.exports = class Compiler extends EventEmitter {
  static get Events() {
    return Events;
  }

  forks: Object;
  tasks: TaskQueue;

  constructor(options: *) {
    super();
    this.forks = {};
    this.tasks = new TaskQueue();

    this.on(Events.REQUEST_BUNDLE, ({ platform, filename, callback }) => {
      if (!this.forks[platform]) {
        this.forks[platform] = this.initFork({ platform, options });
      }

      if (this.forks[platform].isProcessing) {
        this.forks[platform].once(Events.BUILD_FINISHED, ({ error }) => {
          if (error) {
            callback(error, platform, null, null);
          } else {
            const taskId = this.tasks.add({
              callback,
            });
            this.forks[platform].send(Events.REQUEST_FILE, {
              filename,
              taskId,
            });
          }
        });
      } else {
        const taskId = this.tasks.add({
          callback,
        });
        this.forks[platform].send(Events.REQUEST_FILE, { filename, taskId });
      }
    });

    this.on(Events.REQUEST_FILE, ({ filename, callback }) => {
      const taskId = this.tasks.add({
        callback,
      });
      // We cannot know in which fork the files is stored.
      Object.keys(this.forks).forEach(platform => {
        this.forks[platform].send(Events.REQUEST_FILE, { filename, taskId });
      });
    });
  }

  initFork({ platform, options }: { platform: Platform, options: * }) {
    const fork = new Fork({ platform, options });

    fork.on(Events.FILE_RECEIVED, ({ file, taskId }) => {
      const { callback } = this.tasks.get(taskId);
      callback({
        error: null,
        platform,
        file,
        mimeType: 'application/javascript',
      });
    });

    fork.on(Events.BUILD_START, payload => {
      this.emit(Events.BUILD_START, { platform, ...payload });
    });

    fork.on(Events.BUILD_FINISHED, payload => {
      this.emit(Events.BUILD_FINISHED, { platform, ...payload });
    });

    return fork;
  }

  terminate(error?: Error) {
    // logger.info('Shutting down Haul.');

    // error && logger.error(error.message);

    Object.keys(this.forks).forEach(platform =>
      this.forks[platform].terminate()
    );
    process.exit(error ? 1 : 0);
  }
};
