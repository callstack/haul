/* @flow */
const chalk = require("chalk");
const emoji = require("node-emoji");
const fs = require('fs');
const path = require('path');
const { inspect } = require('util');

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

let replaceDebugLogConetnt: boolean = true;
const createDebugLog = (prefix: string, args: any[]): void => {
  const debugLogFilename: string = path.join(process.cwd(), "haul-debug.log");
  const data: string = args.reduce((prev, curr) => {
    return prev.concat(`${typeof curr === "string" ? curr : inspect(curr)}\n`);
  }, `${prefix.toUpperCase()} `);
  (replaceDebugLogConetnt
    ? fs.writeFileSync
    : fs.appendFileSync
  // $FlowFixMe appendFileSync accepts string or objeect as 3rd argument
  )(debugLogFilename, data, "utf-8");
  if (replaceDebugLogConetnt) {
    replaceDebugLogConetnt = false;
  }
};

/**
 * If argument to log is a string it will be emojified, which will replace every :<emoji>:
 * with actul emoji. All supported emojis are listed here:
 * https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
 */
const loggerFactory = (enchance: Function, prefix: string, devMode: boolean) =>
  (...args: any[]) => {
    console.log(
      `${enchance(prefix)}`,
      ...args.map(arg => {
        if (typeof arg === "string") {
          return arg;
        }
        return emoji.emojify(arg instanceof Error ? arg.message : arg);
      })
    );
    if (prefix === "error" || devMode) {
      createDebugLog(prefix, args);
    }
  };


module.exports = (devMode: boolean = false): Logger => ({
  clear,
  printLogo,
  info: loggerFactory(chalk.cyan, "info", devMode),
  warn: loggerFactory(chalk.yellow, "warning", devMode),
  error: loggerFactory(chalk.red, "error", true),
  success: loggerFactory(chalk.green, "success", devMode)
});
