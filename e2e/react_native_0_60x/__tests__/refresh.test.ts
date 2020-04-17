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

const sleep = milliseconds => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};

const replaceInMain = (from, to) => {
  const appContents = fs.readFileSync(PROJECT_FIXTURE_MAIN).toString();
  const replaceResult = appContents.replace(from, to);
  fs.writeFileSync(PROJECT_FIXTURE_MAIN, replaceResult);
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

  test('should return updated bundle', async () => {
    const url = `http://localhost:${port}/index.android.bundle`;

    let res = await fetch(url);
    let bundle = await res.text();

    expect(bundle).toMatch('Donut');

    replaceInMain('Donut', 'Avocado');
    sleep(1000);

    res = await fetch(url);
    bundle = await res.text();

    expect(bundle).toMatch('Avocado');
    expect(bundle).not.toMatch('Donut');
  });
});
