const chalk = require("chalk");
const emoji = require("node-emoji");

const clear = () => {
  process.stdout.write("\u001B[2J\u001B[0;0f");
};

const printLogo = (enchance = chalk.blue) => {
  console.log(
    enchance(
      " _                 _\n" +
        "| |__   __ _ _   _| |\n" +
        "| '_ \\ / _\` | | | | |\n" +
        "| | | | (_| | |_| | |\n" +
        "|_| |_|\\__,_|\\__,_|_|\n" +
        "\n"
    )
  );
};

// @TODO: create haul-debug.log with logged errors

/**
 * If argument to log is a string it will be emojified, which will replace every :<emoji>:
 * with actul emoji. All supported emojis are listed here:
 * https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
 */
const loggerFactory = (enchance, prefix) =>
  (...args) => {
    console.log(
      `${enchance(prefix)}`,
      ...args.map(arg => typeof arg === "string" ? emoji.emojify(arg) : arg)
    );
  };

module.exports = devMode => ({
  clear,
  printLogo,
  info: loggerFactory(chalk.cyan, "info", devMode),
  warn: loggerFactory(chalk.yellow, "warning", devMode),
  error: loggerFactory(chalk.red, "error", true),
  success: loggerFactory(chalk.green, "success", devMode)
});
