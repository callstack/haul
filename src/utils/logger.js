/* @flow */
const chalk = require("chalk");
const emoji = require("node-emoji");

import type { LoggerPrintLogo, Logger } from '../types';

const clear = (): void => {
  process.stdout.write("\u001B[2J\u001B[0;0f");
};

const printLogo: LoggerPrintLogo = (offset = 0, enchance = chalk.blue) => {
  const logoLines: string[] = [
    " _                 _",
    "| |__   __ _ _   _| |",
    "| '_ \\ / _\` | | | | |",
    "| | | | (_| | |_| | |",
    "|_| |_|\\__,_|\\__,_|_|"
  ];
  console.log(
    enchance(
      logoLines.map(line => `${' '.repeat(offset)}${line}`).join("\n"), "\n"
    )
  );
};

// @TODO: create haul-debug.log with logged errors

/**
 * If argument to log is a string it will be emojified, which will replace every :<emoji>:
 * with actul emoji. All supported emojis are listed here:
 * https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
 */
const loggerFactory = (enchance: Function, prefix: string) =>
  (...args: any[]) => {
    console.log(
      `${enchance(prefix)}`,
      ...args.map(arg => typeof arg === "string" ? emoji.emojify(arg) : arg)
    );
  };


module.exports = (devMode: boolean = false): Logger => ({
  clear,
  printLogo,
  info: loggerFactory(chalk.cyan, "info", devMode),
  warn: loggerFactory(chalk.yellow, "warning", devMode),
  error: loggerFactory(chalk.red, "error", true),
  success: loggerFactory(chalk.green, "success", devMode)
});
