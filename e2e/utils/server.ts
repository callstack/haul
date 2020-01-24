import { ChildProcess } from 'child_process';
import { ReadStream } from 'tty';
import stripAnsi from 'strip-ansi';
// @ts-ignore
import { run, yarnCommand } from './common';
// @ts-ignore
import { runHaul } from './runHaul';

export type Instance = {
  server: ChildProcess & {
    stdout: ReadStream;
    stderr: ReadStream;
  };
  disposed: boolean;
};

export function startServer(
  port: number | undefined,
  projectDir: string,
  config: string | undefined,
  done: jest.DoneCallback,
  { skipInstall }: { skipInstall?: boolean } = {}
) {
  if (!skipInstall) {
    run(`${yarnCommand} --mutex network`, projectDir);
  }

  const server = runHaul(projectDir, [
    'start',
    ...(port ? ['--port', port.toString()] : []),
    ...(config ? ['--config', config] : []),
    '--max-workers',
    '1',
  ]) as Instance['server'];
  const instance: Instance = {
    server,
    disposed: false,
  };

  server.stderr.on('data', data => {
    done.fail(data.toString());
  });

  server.stdout.on('data', data => {
    const message = stripAnsi(data.toString()).trim();
    if (message.match(/error/g) && !instance.disposed) {
      done.fail(message);
    } else {
      done();
    }
  });

  return instance;
}

export function stopServer(instance: Instance) {
  instance.disposed = true;
  instance.server.kill();
}
