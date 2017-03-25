/**
 * Taken from create-react-app/packages/react-dev-utils/clearConsole.js
 *
 * clearConsole.js
 */

function clearConsole() {
  process.stdout.write(
    process.platform === 'win32'
      ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H',
  );
}

module.exports = clearConsole;
