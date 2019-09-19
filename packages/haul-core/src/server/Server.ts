import { EnvOptions } from '../config/types';
import { Assign } from 'utility-types';
import Hapi, { ResponseObject } from '@hapi/hapi';
import http from 'http';
import ws from 'ws';
// @ts-ignore
import Compiler from '@haul-bundler/core-legacy/build/compiler/Compiler';
import { terminal } from 'terminal-kit';
import Runtime from '../runtime/Runtime';
import setupDevtoolRoutes from './setupDevtoolRoutes';
import setupCompilerRoutes from './setupCompilerRoutes';
import setupLiveReload from './setupLiveReload';
import setupSymbolication from './setupSymbolication';
import createWebsocketProxy from './websocketProxy';
import WebSocketDebuggerProxy from './WebSocketDebuggerProxy';
import InteractiveUI from './InteractiveUI';
import NonInteractiveUI from './NonInteractiveUI';
import UserInterface from './UI';
import Logger from '../runtime/Logger';
import { container, color, modifier, pad, AnsiColor } from 'ansi-fragments';

type ServerEnvOptions = Assign<
  Pick<EnvOptions, 'dev' | 'minify' | 'assetsDest' | 'root'>,
  {
    noInteractive: boolean;
    eager: string[];
    bundleNames: string[];
    platforms: string[];
  }
>;

export default class Server {
  compiler: any;
  server: Hapi.Server | undefined;
  httpServer: http.Server = http.createServer();
  resetConsole = () => {};
  disposeLoggerProxy = () => {};
  ui: UserInterface;

  constructor(
    private runtime: Runtime,
    private configPath: string,
    private options: ServerEnvOptions
  ) {
    if (this.options.noInteractive) {
      this.ui = new NonInteractiveUI(this.runtime);
    } else {
      this.ui = new InteractiveUI(terminal);
    }
  }

  createCompiler() {
    const compiler = new Compiler(
      {
        configPath: this.configPath,
        configOptions: {
          ...this.options,
          bundleTarget: 'server',
          bundleMode:
            this.options.bundleNames.length > 1
              ? 'multi-bundle'
              : 'single-bundle',
        },
      },
      this.runtime.logger
    );

    compiler.on(
      Compiler.Events.BUILD_START,
      ({ platform }: { platform: string }) => {
        this.ui.updateCompilationProgress(platform, {
          running: true,
          value: 0,
        });
      }
    );

    compiler.on(
      Compiler.Events.BUILD_PROGRESS,
      ({ progress, platform }: { platform: string; progress: number }) => {
        this.ui.updateCompilationProgress(platform, {
          running: true,
          value: progress,
        });
      }
    );

    compiler.on(
      Compiler.Events.BUILD_FAILED,
      ({ platform, message }: { platform: string; message: string }) => {
        this.ui.updateCompilationProgress(platform, {
          running: false,
          value: 0,
        });
        this.ui.addLogItem(
          this.runtime.logger.enhanceWithLevel(Logger.Level.Error, message)
        );
      }
    );

    compiler.on(
      Compiler.Events.BUILD_FINISHED,
      ({ platform, errors }: { platform: string; errors: string[] }) => {
        this.ui.updateCompilationProgress(platform, {
          running: false,
          value: 1,
        });
        errors.forEach(error => {
          this.ui.addLogItem(
            this.runtime.logger.enhanceWithLevel(Logger.Level.Error, error)
          );
        });
      }
    );

    return compiler;
  }

  attachProcessEventsListeners() {
    const createListener = (exitCode: number) => (error: any) => {
      this.exit(exitCode, error);
    };

    // Manually call disposal logic if pressed key is CTRL + C.
    // 'SIGINT' signal won't be emitted on CTRL + C, because stdin is in raw mode.
    terminal.on('key', (name: string) => {
      if (name === 'CTRL_C') {
        createListener(0)(null);
      }
    });
    process.on('uncaughtException', createListener(1));
    process.on('unhandledRejection', createListener(1));
    process.on('SIGINT', createListener(0));
    process.on('SIGTERM', createListener(2));
  }

  exit(exitCode: number, error: any | undefined) {
    this.ui.dispose(exitCode, false);
    this.resetConsole();
    this.disposeLoggerProxy();
    this.compiler.terminate();
    if (error) {
      this.runtime.logger.error(error);
    }
    this.runtime.complete(exitCode);
  }

  async listen(host: string, port: number) {
    // Proxy logs from runtime to interactive server UI only when server is running
    // in interactive mode.
    if (!this.options.noInteractive) {
      this.disposeLoggerProxy = this.runtime.logger.proxy((level, ...args) => {
        this.ui.addLogItem(
          this.runtime.logger.enhanceWithLevel(level, ...args)
        );
      });
    }

    this.resetConsole = this.hijackConsole();
    this.compiler = this.createCompiler();
    this.attachProcessEventsListeners();

    const server = new Hapi.Server({
      port,
      host,
      router: {
        stripTrailingSlash: true,
      },
    });

    const webSocketServer = new ws.Server({ server: server.listener });
    const webSocketProxy = createWebsocketProxy(
      webSocketServer,
      '/debugger-proxy'
    );
    const debuggerProxy = new WebSocketDebuggerProxy(
      this.runtime,
      webSocketProxy
    );

    await server.register(require('@hapi/inert'));

    server.events.on('response', request => {
      if ('statusCode' in request.response) {
        if (request.response.statusCode < 400) {
          this.logServerEvent(request);
        } else {
          this.logServerEvent(request);
        }
      }
    });

    setupSymbolication(this.runtime, server, {
      bundleNames: this.options.bundleNames,
    });
    setupLiveReload(this.runtime, server, this.compiler);
    setupDevtoolRoutes(this.runtime, server, {
      isDebuggerConnected: () => debuggerProxy.isDebuggerConnected(),
    });
    setupCompilerRoutes(this.runtime, server, this.compiler, {
      port,
      bundleNames: this.options.bundleNames,
      platforms: this.options.platforms,
    });

    await server.start();
    this.ui.start(this.options.platforms);
    this.runtime.logger.done(
      `Packager server running on http://${host}:${port}`
    );

    this.options.eager.forEach(platform => {
      this.compiler.emit(Compiler.Events.REQUEST_BUNDLE, {
        filename: `/index.${platform}.bundle`, // NOTE: maybe the entry bundle is arbitrary
        platform,
        callback() {},
      });
    });
  }

  hijackConsole() {
    if (this.options.noInteractive) {
      return () => {};
    }

    /* eslint-disable no-console */
    const log = console.log;
    const error = console.error;

    console.log = (...args) => {
      this.ui.addLogItem(
        this.runtime.logger.enhanceWithLevel(Logger.Level.Info, ...args)
      );
    };

    console.error = (...args) => {
      this.ui.addLogItem(
        this.runtime.logger.enhanceWithLevel(Logger.Level.Error, ...args)
      );
    };

    return () => {
      console.log = log;
      console.error = error;
    };
    /* eslint-enable no-console */
  }

  logServerEvent(request: Hapi.Request, event?: Hapi.RequestEvent) {
    const { statusCode } = request.response as ResponseObject;
    let logColor: AnsiColor = 'green';
    let level: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 300 && statusCode < 400) {
      logColor = 'yellow';
      level = 'warn';
    } else if (statusCode >= 400) {
      logColor = 'red';
      level = 'error';
    }
    this.runtime.logger[level](
      container(
        color(logColor, modifier('bold', request.method.toUpperCase())),
        pad(1),
        request.path,
        pad(1),
        color('gray', statusCode.toString()),
        event ? event.tags.join(' ') : ''
      ).build()
    );
  }
}
