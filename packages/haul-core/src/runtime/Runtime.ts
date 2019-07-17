import {
  RuntimeCompleteEvent,
  RuntimeCommandStartEvent,
  RuntimeUnhandledErrorEvent,
  RuntimeNodeInspectorStartedEvent,
} from '@haul-bundler/inspector-events';
import { terminal } from 'terminal-kit';
import InspectorClient from './InspectorClient';
import Logger from './Logger';

export default class Runtime {
  logger: Logger;

  constructor(private inspectorClient?: InspectorClient) {
    this.logger = new Logger(inspectorClient);
  }

  async ready(waitForInspector: boolean = false): Promise<void> {
    if (waitForInspector && this.inspectorClient) {
      await this.inspectorClient.ready();
    }
  }

  startCommand(command: string | readonly string[], argv: string[]) {
    if (this.inspectorClient) {
      this.inspectorClient.emitEvent(
        new RuntimeCommandStartEvent(
          typeof command === 'string' ? command : command.join(' '),
          argv
        )
      );
    }
  }

  unhandledError(error: Error | string) {
    this.logger.error('Unhandled error:', error);
    if (this.inspectorClient) {
      this.inspectorClient.emitEvent(new RuntimeUnhandledErrorEvent(error));
    }
  }

  nodeInspectorStarted(wait: boolean = false) {
    if (this.inspectorClient) {
      this.inspectorClient.emitEvent(
        new RuntimeNodeInspectorStartedEvent(wait)
      );
    }
  }

  complete(exitCode: number = 0) {
    this.logger.dispose();
    if (this.inspectorClient) {
      this.inspectorClient.emitEvent(new RuntimeCompleteEvent(exitCode));
      this.inspectorClient.close();
    }
    terminal.processExit(exitCode);
  }
}
