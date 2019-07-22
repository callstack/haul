export default interface UserInterface {
  start(platforms: string[]): void;
  dispose(exitCode: number, exit: boolean): void;
  addLogItem(item: string): void;
  updateCompilationProgress(
    platform: string,
    { running, value }: { running: boolean; value: number }
  ): void;
}
