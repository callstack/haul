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

async function findAndReplaceFile(
  regexFindPattern,
  replaceValue,
  originalFile
) {
  const updatedFile = `${originalFile}.temp`;

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(originalFile, {
      encoding: 'utf8',
      autoClose: true,
    });
    const writeStream = fs.createWriteStream(updatedFile, {
      encoding: 'utf8',
      autoClose: true,
    });

    readStream.on('data', chunk => {
      chunk = chunk.toString().replace(regexFindPattern, replaceValue);
      writeStream.write(chunk);
    });

    readStream.on('end', () => {
      writeStream.end();
      fs.unlinkSync(originalFile);
      fs.renameSync(updatedFile, originalFile);
      console.log("replace time end: " + new Date().getTime())
    });
    readStream.on('error', error =>
      reject(`Error: Error reading ${originalFile} => ${error.message}`)
    );
    writeStream.on('error', error =>
      reject(`Error: Error writing to ${updatedFile} => ${error.message}`)
    );
    resolve();
  });
}

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
    try {
      findAndReplaceFile('Avocado', 'Donut', PROJECT_FIXTURE_MAIN);
    } catch (error) {
      console.log(error);
    }
  });

  const url = `http://localhost:${port}/index.android.bundle`;

  it('should update returned bundle', async () => {
    console.log("fetch 1. time: " + new Date().getTime())
    let res = await fetch(url);
    let bundle = await res.text();

    fs.writeFileSync('./helloworld.txt', bundle);

    expect(bundle).toMatch('Donut');

    try {
      console.log("replace time: " + new Date().getTime())
      await findAndReplaceFile('Donut', 'Avocado', PROJECT_FIXTURE_MAIN);
    } catch (error) {
      console.log(error);
    }

    console.log("fetch 2. time: " + new Date().getTime())
    res = await fetch(url);
    bundle = await res.text();

    fs.writeFileSync('./helloworld2.txt', bundle);

    // expect(bundle).toMatch('Avocado');
    // expect(bundle).not.toMatch('Donut');
  });
});
