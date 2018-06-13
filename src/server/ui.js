/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */
import type { Platform } from '../types';

const path = require('path');
const React = require('react');
const morgan = require('morgan');
const { Subject } = require('rxjs');
const { renderToTerminal, Text, ProgressBar } = require('react-slate');
const { hideCursor, overwriteConsole } = require('react-slate-utils');
const emoji = require('node-emoji');
const Compiler = require('../compiler/Compiler');
const logger = require('../logger');

const outStream = 'node_modules/.haul-artifacts/stdout.log';
const errStream = 'node_modules/.haul-artifacts/stderr.log';

/**
 * Create and render React-powered UI for Haul packager server.
 * Returns a logger middleware for express.
 * 
 * Warning: contains side effects: clears screen and renders an app + overwrites logger.
 */
module.exports = function initUI(
  compiler: Compiler,
  { port }: { port: number }
) {
  let nextId = 0;
  const logs = new Subject();

  // Logger's methods need to be overwritten with custom React-aware implementation,
  // so the logs get nicely displayed in appropriate section.
  Object.keys(logger).forEach(key => {
    if (key !== 'reset') {
      logger[key] = (...args) => {
        logs.next({
          issuer: 'haul',
          id: nextId++,
          type: key,
          body: args,
        });
      };
    }
  });

  hideCursor(process.stdout);
  overwriteConsole({
    outStream,
    errStream,
  });

  renderToTerminal(
    <ServerUI
      port={port}
      compiler={compiler}
      logs={logs}
      height={((process.stdout: any): tty$WriteStream).rows || 20}
    />,
    process.stdout
  );

  return morgan((tokens, req, res) => {
    const message = {
      id: nextId++,
      method: tokens.method(req, res),
      path: req.path,
      status: tokens.status(req, res),
      length: tokens.res(req, res, 'content-length'),
      time: tokens['response-time'](req, res),
    };
    logs.next({
      issuer: 'express',
      body: message,
    });
  });
};

function isCompilationInProgress(value) {
  return value >= 0 && value < 1;
}

type ServerPropsType = {
  port: number,
  compiler: Compiler,
  logs: Subject,
  height: number,
};

type forkStatusType = 'cold' | 'hot' | 'error';

type ServerStateType = {
  compilationProgress: {
    ios: number,
    android: number,
  },
  forkStatus: {
    ios: forkStatusType,
    android: forkStatusType,
  },
  logs: Array<{
    body: any,
    type: string,
    id: number,
  }>,
  errors: Array<String>,
};

class ServerUI extends React.Component<ServerPropsType, ServerStateType> {
  constructor(props) {
    super(props);

    this.state = {
      compilationProgress: {
        ios: -1,
        android: -1,
      },
      forkStatus: {
        ios: 'cold',
        android: 'cold',
      },
      logs: [],
      errors: [],
    };

    this.props.compiler.on(
      Compiler.Events.BUILD_PROGRESS,
      ({ progress, platform }) => {
        this._ensurePlatformState(platform);
        this.setState(state => ({
          compilationProgress: {
            ...state.compilationProgress,
            [platform]: progress,
          },
        }));
      }
    );

    this.props.compiler.on(Compiler.Events.BUILD_START, ({ platform }) => {
      this._ensurePlatformState(platform);
      this.setState(state => ({
        forkStatus: {
          ...state.forkStatus,
          [platform]: 'hot',
        },
      }));
    });

    this.props.compiler.on(
      Compiler.Events.BUILD_FAILED,
      ({ platform, message }) => {
        this._ensurePlatformState(platform);
        this.setState(state => ({
          errors: [...state.errors, message],
          forkStatus: {
            ...state.forkStatus,
            [platform]: 'error',
          },
        }));
      }
    );

    this.props.compiler.on(
      Compiler.Events.BUILD_FINISHED,
      ({ platform, errors }) => {
        this._ensurePlatformState(platform);
        this.setState(state => ({
          compilationProgress: {
            ...state.compilationProgress,
            [platform]: 1,
          },
          errors,
        }));
      }
    );

    this.props.logs.subscribe(next => {
      this.setState(state => ({
        logs: [...state.logs, next],
      }));
    });
  }

  _ensurePlatformState(platform: Platform) {
    if (this.state.compilationProgress[platform] === undefined) {
      this.setState(state => ({
        compilationProgress: {
          ...state.compilationProgress,
          [platform]: -1,
        },
        forkStatus: {
          ...state.forkStatus,
          [platform]: 'cold',
        },
      }));
    }
  }

  _makeProgressBar(platform: Platform, label, marginLeft = 0) {
    return (
      <Text key={platform}>
        <Text
          style={{
            ...styles.progressLabel,
            ...(isCompilationInProgress(
              this.state.compilationProgress[platform]
            )
              ? {}
              : styles.progressDisabled),
            marginLeft,
          }}
        >
          {label}
        </Text>
        <Text style={{ margin: '0 2 0 1', display: 'inline' }}>
          {emoji.get(
            {
              hot: 'fire',
              cold: 'zzz',
              error: 'warning',
            }[this.state.forkStatus[platform]]
          )}
        </Text>
        <ProgressBar
          value={Math.max(this.state.compilationProgress[platform], 0)}
          barWidth={20}
          style={
            isCompilationInProgress(this.state.compilationProgress[platform])
              ? {}
              : styles.progressDisabled
          }
        />
        <Text
          style={{
            ...styles.progressLabel,
            ...(isCompilationInProgress(
              this.state.compilationProgress[platform]
            )
              ? {}
              : styles.progressDisabled),
            marginLeft: '1',
          }}
        >
          {Math.floor(
            Math.max(this.state.compilationProgress[platform], 0) * 100
          )}%
        </Text>
      </Text>
    );
  }

  _makeExpressLog(body: Object) {
    return (
      <Text style={styles.logItem} key={body.id}>
        <Text style={styles.logItemStatus(body.status)}>{body.status}</Text>
        <Text style={styles.logItemMethod}>{body.method}</Text>
        <Text style={styles.logItemPath}>{body.path}</Text>
        <Text style={styles.logItemAdditionalInfo}>{body.length}b</Text>
        <Text style={styles.logItemAdditionalInfo}>{body.time}ms</Text>
      </Text>
    );
  }

  _makeHaulLog(type: string, id: number, body: any[]) {
    return (
      <Text style={styles.logItem} key={id}>
        <Text style={styles.haulLogItemType(type)}>{type}</Text>
        {body.join(' ').replace(/\n$/g, '')}
      </Text>
    );
  }

  _displayLogs() {
    return (
      <Text>
        <Text style={styles.logsLabel}>logs</Text>
        {this.state.logs.length === 0 ? (
          <Text style={{ color: 'ansi-gray', marginLeft: 2 }}>(empty)</Text>
        ) : null}
        {this.state.logs
          .slice(-this.props.height + 10)
          .map(
            item =>
              item.issuer === 'express'
                ? this._makeExpressLog(item.body)
                : this._makeHaulLog(item.type, item.id, item.body)
          )}
      </Text>
    );
  }

  _displayErrors() {
    console.log('ERROR', this.state.errors.join('\n'));

    // This way of displaying errors is good enough for now,
    // later down the road it would be better to create
    // a scrollable container with fixed height, which will display errors.

    return (
      <Text>
        <Text style={styles.errorsLabel}>error</Text>
        <Text>
          {this.state.errors[0]
            .split('\n')
            .slice(0, 2)
            .join('\n')}
        </Text>

        <Text style={{ marginTop: 1, color: 'ansi-gray' }}>
          (Full error description can be found in {path.resolve(outStream)})
        </Text>
      </Text>
    );
  }

  render() {
    return (
      <Text>
        <Text style={styles.welcomeMessage}>done</Text>
        Haul running at port {this.props.port}
        <Text style={styles.progressContainer}>
          {Object.keys(this.state.compilationProgress)
            .sort()
            .map(platform => {
              return this._makeProgressBar(
                platform,
                platform,
                7 - platform.length > 0 ? 7 - platform.length : 0
              );
            })}
        </Text>
        {this.state.errors.length ? this._displayErrors() : this._displayLogs()}
      </Text>
    );
  }
}

const styles = {
  welcomeMessage: {
    backgroundColor: 'ansi-green',
    color: 'black',
    display: 'inline',
    marginRight: 1,
    padding: '0 2',
    textTransform: 'uppercase',
  },
  progressContainer: {
    margin: '1 0',
  },
  progressDisabled: {
    color: 'ansi-gray',
  },
  progressLabel: {
    display: 'inline',
    color: 'ansi-blue',
  },
  logsLabel: {
    textTransform: 'uppercase',
    padding: '0 2',
    backgroundColor: 'ansi-cyan',
    color: 'black',
    marginBottom: 1,
  },
  logItem: {
    marginLeft: 2,
  },
  haulLogItemType(type) {
    let color = '';
    switch (type) {
      default:
      case 'info':
        color = 'ansi-white';
        break;
      case 'error':
        color = 'ansi-red';
        break;
      case 'warn':
        color = 'ansi-yellow';
        break;
      case 'done':
        color = 'ansi-green';
        break;
      case 'debug':
        color = 'ansi-gray';
        break;
    }

    return {
      marginRight: 1,
      textTransform: 'uppercase',
      display: 'inline',
      color,
    };
  },
  logItemStatus(status) {
    return {
      color: Number(status) === 200 ? 'ansi-green' : 'ansi-red',
      display: 'inline',
      marginLeft: status ? 0 : 3,
    };
  },
  logItemMethod: {
    color: 'ansi-magenta',
    margin: '0 1',
    display: 'inline',
  },
  logItemPath: {
    color: 'ansi-white',
    marginRight: 2,
    display: 'inline',
  },
  logItemAdditionalInfo: {
    color: 'ansi-gray',
    marginRight: 1,
    display: 'inline',
  },
  errorsLabel: {
    textTransform: 'uppercase',
    padding: '0 2',
    backgroundColor: 'ansi-red',
    color: 'black',
    marginBottom: 1,
  },
};
