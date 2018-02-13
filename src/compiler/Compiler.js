/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { Platform, Logger } from '../types';

const EventEmitter = require('events');
const Events = require('./events');
const Fork = require('./Fork');
const TaskQueue = require('./TaskQueue');

/**
 * Compiler provides a interface over forks and handles theirs creation.
 * The consumer doesn't have to worry about to which fork emit a event,
 * but just provide a platform. They it's up to Compiler to route the event
 * to correct fork.
 */
module.exports = class Compiler extends EventEmitter {
  static get Events() {
    return Events;
  }

  forks: { [key: Platform]: Fork };
  tasks: TaskQueue;
  logger: Logger;

  constructor(logger: Logger, options: *) {
    super();
    this.forks = {};
    this.tasks = new TaskQueue();
    this.logger = logger;

    this.on(Events.REQUEST_BUNDLE, ({ platform, filename, callback }) => {
      if (!this.forks[platform]) {
        this.forks[platform] = this.initFork({ platform, options });
      }

      // If the fork is compiling the bundle, attach listener to emit `REQUEST_FILE` once
      // the bundle is created, otherwise simply request the file. Callback will be then invoked in
      // `FILE_RECEIVED` listener.
      if (this.forks[platform].isProcessing) {
        this.forks[platform].once(Events.BUILD_FINISHED, ({ stats }) => {
          if (stats.errors.length) {
            callback({
              errors: stats.errors,
              platform,
              mimeType: null,
              file: null,
            });
          } else {
            const taskId = this.tasks.add({ callback });
            this.forks[platform].send(Events.REQUEST_FILE, {
              filename,
              taskId,
            });
          }
        });
      } else {
        const taskId = this.tasks.add({ callback });
        this.forks[platform].send(Events.REQUEST_FILE, { filename, taskId });
      }
    });

    this.on(Events.REQUEST_FILE, ({ filename, callback }) => {
      // Callback will be invoked on `FILE_RECEIVED` event.
      const taskId = this.tasks.add({ callback });
      // We cannot know in which fork the file is stored.
      Object.keys(this.forks).forEach(platform => {
        this.forks[platform].send(Events.REQUEST_FILE, { filename, taskId });
      });
    });
  }

  /**
   * Create fork process and attach necessary event listeners.
   */
  initFork({ platform, options }: { platform: Platform, options: * }) {
    const fork = new Fork({ platform, options });

    fork.on(Events.FILE_RECEIVED, ({ file, taskId }) => {
      const { callback } = this.tasks.get(taskId);
      callback({
        errors: null,
        platform,
        file,
        mimeType: 'application/javascript',
      });
    });

    fork.on(Events.BUILD_START, payload => {
      this.emit(Events.BUILD_START, { platform, ...payload });
    });

    fork.on(Events.BUILD_FINISHED, payload => {
      this.emit(Events.BUILD_FINISHED, {
        platform,
        ...payload,
        errors: payload.stats.errors,
      });
    });

    fork.on(Events.BUILD_PROGRESS, payload => {
      this.emit(Events.BUILD_PROGRESS, { platform, ...payload });
    });

    return fork;
  }

  terminate(error?: Error) {
    this.logger.info('Shutting down Haul.');

    error && this.logger.error(error.message);

    Object.keys(this.forks).forEach(platform =>
      this.forks[platform].terminate()
    );
    process.exit(error ? 1 : 0);
  }
};
