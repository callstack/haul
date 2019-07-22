import Runtime from '../runtime/Runtime';

export default class NonInteractiveUserInterface {
  constructor(private runtime: Runtime) {}

  updateCompilationProgress(
    platform: string,
    { running, value }: { running: boolean; value: number }
  ) {
    if (running) {
      const percent = `${Math.floor(Math.min(1, value) * 100)}%`;
      this.runtime.logger.info(`Compilation - running (${percent})`);
    } else {
      this.runtime.logger.info(`Compilation - idle`);
    }
  }

  addLogItem(item: string) {
    // `item` should be already enhanced with ANSI escape codes
    this.runtime.logger.print(item);
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
