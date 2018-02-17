/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const path = require('path');
const React = require('react');
const morgan = require('morgan');
const { Subject } = require('rxjs');
const { render, Text, ProgressBar } = require('react-stream-renderer');
const emoji = require('node-emoji');
const Compiler = require('../compiler/Compiler');

// $FlowFixMe
const HEIGHT = process.stdout.rows;

module.exports = function initUI(
  compiler: Compiler,
  { port }: { port: number }
) {
  const stdout = {
    write: process.stdout.write.bind(process.stdout),
    // $FlowFixMe
    columns: process.stdout.columns,
    rows: HEIGHT,
  };

  const logs = new Subject();

  render(<ServerUI port={port} compiler={compiler} logs={logs} />, stdout, {
    hideCursor: true,
  });

  let nextId = 0;
  return morgan((tokens, req, res) => {
    const message = {
      id: nextId++,
      method: tokens.method(req, res),
      path: req.path,
      status: tokens.status(req, res),
      length: tokens.res(req, res, 'content-length'),
      time: tokens['response-time'](req, res),
    };
    logs.next(message);
  });
};

function isCompilationInProgress(value) {
  return value >= 0 && value < 1;
}

class ServerUI extends React.Component<*, *> {
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
        this.setState(state => ({
          compilationProgress: {
            ...state.compilationProgress,
            [platform]: progress,
          },
        }));
      }
    );

    this.props.compiler.on(Compiler.Events.BUILD_START, ({ platform }) => {
      this.setState(state => ({
        forkStatus: {
          ...state.forkStatus,
          [platform]: 'hot',
        },
      }));
    });

    this.props.compiler.on(
      Compiler.Events.BUILD_FINISHED,
      ({ platform, errors }) => {
        this.setState(state => ({
          compilationProgress: {
            ...state.compilationProgress,
            [platform]: 1,
          },
          errors,
        }));
      }
    );

    this.props.logs.subscribe(message => {
      this.setState(state => ({
        logs: [...state.logs, message],
      }));
    });
  }

  _makeProgressBar(platform, label, marginLeft = 0) {
    return (
      <Text>
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
            this.state.forkStatus[platform] === 'hot' ? 'fire' : 'zzz'
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
          {isCompilationInProgress(this.state.compilationProgress[platform])
            ? Math.floor(this.state.compilationProgress[platform] * 100)
            : '0'}%
        </Text>
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
        {this.state.logs.slice(-HEIGHT + 10).map(item => (
          <Text style={styles.logItem} key={item.id}>
            <Text style={styles.logItemStatus(item.status)}>{item.status}</Text>
            <Text style={styles.logItemMethod}>{item.method}</Text>
            <Text style={styles.logItemPath}>{item.path}</Text>
            <Text style={styles.logItemAdditionalInfo}>{item.length}b</Text>
            <Text style={styles.logItemAdditionalInfo}>{item.time}ms</Text>
          </Text>
        ))}
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
          (Full error description can be found in {path.resolve('stdout.log')})
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
          {this._makeProgressBar('ios', 'iOS', 4)}
          {this._makeProgressBar('android', 'Android')}
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
