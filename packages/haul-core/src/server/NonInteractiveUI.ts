import Runtime from '../runtime/Runtime';
import UserInterface from './UI';

export default class NonInteractiveUserInterface implements UserInterface {
  constructor(private runtime: Runtime) {}

  updateCompilationProgress(
    platform: string,
    { running, value }: { running: boolean; value: number }
  ) {
    if (running) {
      const percent = `${Math.floor(Math.min(1, value) * 100)}%`;
      this.runtime.logger.info(
        `[${platform.toUpperCase()}] Compilation - running (${percent})`
      );
    } else {
      this.runtime.logger.info(
        `[${platform.toUpperCase()}] Compilation - idle`
      );
    }
  }

  addLogItem(item: string) {
    // `item` should be already enhanced with ANSI escape codes
    this.runtime.logger.print('print', item);
  }

  dispose(exitCode: number = 0, exit: boolean = true) {
    if (exit) {
      process.exit(exitCode);
    }
  }

  start(platforms: string[]) {
    this.runtime.logger.done('Running in non-interactive mode');
    this.runtime.logger.info(`Available platforms: ${platforms.join(', ')}`);
  }
}
