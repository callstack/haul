import path from 'path';
import escapeStringRegexp from 'escape-string-regexp';
import Runtime from '../../runtime/Runtime';

type Request = {
  path: string;
  relativePath: string;
};

type Options = {
  test?: RegExp;
  platform: string;
  runtime: Runtime;
};

type CollectOutput = {
  [key: string]: {
    platform: string;
    name: string;
  };
};

type CollectOptions = {
  name: string;
  platform: string;
  type: string;
};

export default class AssetResolver {
  static test = /\.(aac|aiff|bmp|caf|gif|html|jpeg|jpg|m4a|m4v|mov|mp3|mp4|mpeg|mpg|obj|otf|pdf|png|psd|svg|ttf|wav|webm|webp)$/;
  static collect(
    list: Array<string>,
    { name, type, platform }: CollectOptions
  ): CollectOutput {
    const regex = /^(bmp|gif|jpg|jpeg|png|psd|tiff|webp|svg)$/.test(type)
      ? new RegExp(
          `^${escapeStringRegexp(
            name
          )}(@\\d+(\\.\\d+)?x)?(\\.(${platform}|native))?\\.${type}$`
        )
      : new RegExp(
          `^${escapeStringRegexp(name)}(\\.(${platform}|native))?\\.${type}$`
        );
    const priority = (queryPlatform: string) =>
      ['native', platform].indexOf(queryPlatform);

    // Build a map of files according to the scale
    return list.reduce(
      (acc, curr) => {
        const match = regex.exec(curr);

        if (match) {
          let [, scale, , , platform] = match;
          scale = scale || '@1x';

          if (
            acc[scale] &&
            priority(platform) < priority(acc[scale].platform)
          ) {
            // do nothing
            return acc;
          }

          return { ...acc, [scale]: { platform, name: curr } };
        }

        return acc;
      },
      {} as CollectOutput
    );
  }

  constructor(private options: Options) {}

  apply(resolver: any) {
    const platform = this.options.platform;
    const test = this.options.test || AssetResolver.test;
    const runtime = this.options.runtime;

    resolver.hooks.file.tapAsync(
      'AssetResolver',
      (request: Request, _: any, callback: Function) => {
        if (!test.test(request.path)) {
          callback();
          return;
        }

        resolver.fileSystem.readdir(
          path.dirname(request.path),
          (error: Error | null, result: any) => {
            if (error) {
              callback();
              return;
            }

            const name = path.basename(request.path).replace(/\.[^.]+$/, '');
            const type = request.path.split('.').pop() || '';

            let resolved = result.includes(path.basename(request.path))
              ? request.path
              : null;

            if (!resolved) {
              const map = AssetResolver.collect(result, {
                name,
                type,
                platform,
              });
              const key = map['@1x']
                ? '@1x'
                : Object.keys(map).sort(
                    (a, b) =>
                      Number(a.replace(/[^\d.]/g, '')) -
                      Number(b.replace(/[^\d.]/g, ''))
                  )[0];

              resolved =
                map[key] && map[key].name
                  ? path.resolve(path.dirname(request.path), map[key].name)
                  : null;
            }

            if (!resolved) {
              runtime.logger.warn(`Cannot resolve: ${request.path}`);
              callback();
              return;
            }

            const resolvedFile = {
              ...request,
              path: resolved,
              relativePath:
                request.relativePath &&
                resolver.join(request.relativePath, resolved),
              file: true,
            };

            runtime.logger.debug(
              `Resolved file: ${request.path} <--> ${resolvedFile.path}`
            );
            callback(null, resolvedFile);
          }
        );
      }
    );
  }
}
