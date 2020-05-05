/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import type { Platform } from '../types';

const EventEmitter = require('events');
const fs = require('fs');

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

  constructor(options: *, logger) {
    super();
    this.forks = {};
    this.tasks = new TaskQueue();
    this.logger = logger;

    this.on(
      Events.REQUEST_BUNDLE,
      async ({ bundleOptions, platform, filename, callback }) => {
        if (!this.forks[platform]) {
          this.forks[platform] = await this.initFork({
            platform,
            options: {
              ...options,
              configOptions: { ...options.configOptions, ...bundleOptions },
            },
          });
        }

        if (!this.forks[platform]) return;

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
      }
    );

    this.on(Events.REQUEST_FILE, ({ filename, callback }) => {
      // If there are no forks spawned, execute callback immediately
      // with null.
      if (!Object.keys(this.forks).length) {
        callback({
          errors: null,
          platform: null,
          file: null,
          mimeType: null,
        });
      }

      // Callback will be invoked on `FILE_RECEIVED` event or on `FILE_NOT_FOUND`.
      const taskId = this.tasks.add({
        callback,
        awaitingCount: Object.keys(this.forks).length,
      });
      // We cannot know in which fork the file is stored, so we send event to all
      // of them and keep count of how many of them responded with `FILE_NOT_FOUND`.
      Object.keys(this.forks).forEach(platform => {
        this.forks[platform].send(Events.REQUEST_FILE, { filename, taskId });
      });
    });
  }

  /**
   * Create fork process and attach necessary event listeners.
   */
  async initFork({ platform, options }: { platform: Platform, options: * }) {
    let fork;
    try {
      fork = new Fork({ platform, options });
      await fork.init();
    } catch (message) {
      this.emit(Events.BUILD_FAILED, { platform, message });
      return null;
    }

    fork.on(Events.FILE_NOT_FOUND, ({ taskId }) => {
      const { callback, awaitingCount } = this.tasks.pop(taskId);

      // If the value is more than 1, it means that we are still awaiting
      // responses, so we put the task back with the same ID and decremented count.
      if (awaitingCount > 1) {
        this.tasks.set(taskId, { callback, awaitingCount: awaitingCount - 1 });
      } else if (callback) {
        callback({
          errors: null,
          platform,
          file: null,
          mimeType: null,
        });
      }
    });

    fork.on(Events.FILE_RECEIVED, ({ filePath, taskId, mimeType }) => {
      const { callback, awaitingCount } = this.tasks.pop(taskId);

      // If the value is more than 1, it means that we are still awaiting
      // responses from other forks, so we put the task back with the same ID and decremented count and null callback.
      if (awaitingCount > 1) {
        this.tasks.set(taskId, {
          callback: null,
          awaitingCount: awaitingCount - 1,
        });
      }
      if (callback) {
        callback({
          errors: null,
          platform,
          file: fs.readFileSync(filePath),
          mimeType,
        });
      }
    });

    fork.on(Events.LOG, ({ message, level }) => {
      this.logger[level] && this.logger[level](message);

      this.emit(Events.BUILD_START, { platform, message });
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

    fork.on(Events.BUILD_FAILED, payload => {
      this.emit(Events.BUILD_FAILED, { platform, ...payload });
    });

    return fork;
  }

  terminate() {
    Object.keys(this.forks).forEach(platform =>
      this.forks[platform].terminate()
    );
  }
};
