import { exec } from 'child_process';
import Runtime from '../runtime/Runtime';

export default function runAdbReverse(
  runtime: Runtime,
  port: number
): Promise<string | undefined> {
  const androidHome = process.env.ANDROID_HOME;
  const adb = androidHome ? `${androidHome}/platform-tools/adb` : 'adb';
  const command = `${adb} reverse tcp:${port} tcp:${port}`;

  return new Promise(resolve => {
    exec(command, error => {
      if (error) {
        // Get just the error message
        const message = error.message.split('error:')[1] || error.message;
        runtime.logger.warn(`Failed to run: ${command} - ${message.trim()}`);
        resolve();
        return;
      }
      runtime.logger.done(`Successfully run: ${command}`);
      resolve();
    });
  });
}
