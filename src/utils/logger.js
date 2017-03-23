const chalk = require('chalk');

const clear = () => {
  process.stdout.write('\u001B[2J\u001B[0;0f');
};

const printLogo = (enchance = chalk.blue) => {
  console.log(enchance(
      ' _                 _\n'
    + '| |__   __ _ _   _| |\n'
    + '| \'_ \\ / _\` | | | | |\n'
    + '| | | | (_| | |_| | |\n'
    + '|_| |_|\\__,_|\\__,_|_|\n'
    + '\n'
  ));
};

// @TODO: create haul-debug.log with logged errors

const loggerFactory = (enchance, prefix) => (...args) => {
  console.log(`${enchance(prefix)}`, ...args);
};

module.exports = (devMode) => ({
  clear,
  printLogo,
  info: loggerFactory(chalk.cyan, 'info', devMode),
  warn: loggerFactory(chalk.yellow, 'warning', devMode),
  error: loggerFactory(chalk.red, 'error', true),
  success: loggerFactory(chalk.green, 'success', devMode),
});