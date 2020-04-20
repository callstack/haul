import { terminal } from 'terminal-kit';
import Logger from './Logger';

export default class Runtime {
  logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  unhandledError(error: Error | string) {
    this.logger.error('Unhandled error:', error);
  }

  complete(exitCode: number = 0) {
    this.logger.dispose();
    terminal.processExit(exitCode);
  }
}
