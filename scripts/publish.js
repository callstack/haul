const path = require('path');
const { spawnSync, execSync } = require('child_process');
const chalk = require('chalk').default;

const LERNA_BIN = path.join(__dirname, '../node_modules/.bin/lerna');

// Bump versions and prepare package.jsons
spawnSync('node', [LERNA_BIN, 'version', '--no-push', '--no-git-tag-version'], {
  stdio: 'inherit',
});

const packages = JSON.parse(
  execSync(`node ${LERNA_BIN} list --json`).toString()
);

let packagesVersion;

// Publish packages to NPM
packages.forEach(({ name, location, version }) => {
  packagesVersion = version;
  // eslint-disable-next-line no-console
  console.log(`${chalk.blue('info')} Publishing package ${name}`);
  spawnSync(
    'yarn',
    ['publish', '--new-version', version, '--access', 'public'],
    {
      cwd: location,
      stdio: 'inherit',
    }
  );
});

// Push publish commit
spawnSync('git', ['add', 'lerna.json', 'packages/*/package.json'], {
  stdio: 'inherit',
});
spawnSync('git', ['commit', '-m', `"chore: publish v${packagesVersion}"`], {
  stdio: 'inherit',
});
spawnSync('git', ['push'], {
  stdio: 'inherit',
});
