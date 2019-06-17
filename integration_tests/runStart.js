const fs = require('fs');
const path = require('path');
const os = require('os');

const TEMP_DIR = path.join(os.tmpdir(), 'haul-start-');
const TEST_PROJECT_DIR = process.argv[2];

const { Server, Runtime } = require(path.join(
  TEST_PROJECT_DIR,
  '../../packages/haul-core/build'
));

const runtime = new Runtime();
const server = new Server(
  runtime,
  path.join(TEST_PROJECT_DIR, 'haul.config.js'),
  {
    dev: true,
    noInteractive: true,
    minify: false,
    root: TEST_PROJECT_DIR,
    assetsDest: fs.mkdtempSync(TEMP_DIR),
    eager: [],
    bundleNames: ['index'],
  }
);
server.listen('localhost', 8081).then(() => {
  console.log('RUNNING');
});
