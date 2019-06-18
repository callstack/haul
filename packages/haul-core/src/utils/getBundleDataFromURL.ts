type BundleData = {
  name: string;
  type: string;
  platform?: string;
  path: string;
};

export default function getBundleDataFromURL(url: string): BundleData {
  let name: string;
  let type: string;
  let platform: string | undefined;
  let path: string | undefined;
  let file: string;

  if (url.startsWith('http')) {
    const [, baseUrl, filename] = /^(https?:\/\/.+\/)(.+)$/.exec(url) || [
      '',
      undefined,
      undefined,
    ];
    if (!baseUrl || !filename) {
      throw new Error(`${url} is not a valid bundle URL`);
    }

    path = baseUrl;
    platform = (filename.match(/platform=([a-zA-Z]*)/) || ['', undefined])[1];
    file = (filename.match(/^([^?]+)/) || ['', ''])[1];
  } else {
    const [, filePath, filename] = /(.*\/)?([^/]+)$/.exec(url) || [
      '',
      '',
      undefined,
    ];
    if (!filename) {
      throw new Error(`${url} is not a valid bundle URL`);
    }

    file = filename;
    path = filePath;
  }

  const segments = file.split('.');
  if (segments.length > 2) {
    name = segments.slice(0, segments.length - 2).join('.');
    platform = segments[segments.length - 2];
    type = segments[segments.length - 1];
  } else {
    [name, type] = segments;
  }

  return {
    name,
    type,
    platform,
    path: path || '',
  };
}
