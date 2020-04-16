import path from 'path';
import fs from 'fs';
import { installDeps } from '../../utils/common';
import { cleanup } from '../../utils/bundle';
import { Instance, startServer, stopServer } from '../../utils/server';
import fetch from 'node-fetch';

const PROJECT_FIXTURE = path.join(
  __dirname,
  '../../../fixtures',
  'react_native_with_haul_0_60x'
);
const PROJECT_FIXTURE_MAIN = PROJECT_FIXTURE + '/App.js';

const replaceInMain = (from, to) => {
  const appContents = fs.readFileSync(PROJECT_FIXTURE_MAIN, {
    encoding: 'utf8',
  });
  var replaceResult = appContents.replace(from, to);
  fs.writeFileSync(PROJECT_FIXTURE_MAIN, replaceResult, { encoding: 'utf8' });
};

describe('test bundle refresh on edit', () => {
  const port = 8000;
  let instance: Instance;
  beforeAll(done => {
    installDeps(PROJECT_FIXTURE);
    instance = startServer(port, PROJECT_FIXTURE, undefined, done);
  });
  afterAll(() => {
    stopServer(instance);
    cleanup(PROJECT_FIXTURE);
    replaceInMain('Avocado', 'Donut');
  });

  const url = `http://localhost:${port}/index.android.bundle`;

  it('should update returned bundle', async () => {
    const resOriginal = await fetch(url);
    const bundleOriginal = await resOriginal.text();

    replaceInMain('Donut', 'Avocado');

    const resChanged = await fetch(url);
    const bundleChanged = await resChanged.text();

    expect(bundleOriginal).toMatch('Donut');
    expect(bundleChanged).not.toMatch('Donut');
    expect(bundleChanged).toMatch('Avocado');
  });
});
