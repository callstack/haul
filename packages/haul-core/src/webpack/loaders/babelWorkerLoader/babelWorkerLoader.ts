import loaderUtils from 'loader-utils';
import Worker from 'jest-worker';
import onExit from 'signal-exit';

function makeLoader() {
  let worker: undefined | Worker;

  onExit(async () => {
    await worker?.end();
  });

  return async function(this: any, source: string, inputSourceMap: string) {
    const { maxWorkers = 1, ...options }: { maxWorkers?: number } =
      loaderUtils.getOptions(this) || {};
    if (worker === undefined) {
      worker = new Worker(require.resolve('./worker'), {
        numWorkers: maxWorkers,
        enableWorkerThreads: true,
      });
    }

    // Make the loader async
    const callback = this.async();
    const sourceMap = this.sourceMap;
    const result = await worker
      // @ts-ignore
      .process(source, inputSourceMap, this.resourcePath, options, sourceMap)
      .then(
        (args: []) => callback?.(null, ...args),
        (err: Error) => callback?.(err)
      );
    return result;
  };
}

export const custom = makeLoader;
export const pitch = makeLoader();
