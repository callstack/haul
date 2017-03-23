/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
const program = require("commander");
const pjson = require("../../package.json");
const logger = require("../utils/logger")(false);

import type { Command, Context } from "../types";

const commands: Array<Command> = [require("./start")];

commands.forEach((command: Command) => {
  const options = command.options || [];

  const cmd = program
    .command(command.name)
    .description(command.description)
    .action(function run() {
      logger.clear();
      logger.printLogo();

      const options = this.opts();
      const argv: Array<string> = Array.from(arguments).slice(0, -1);

      try {
        command.action(argv, options);
      } catch (error) {
        logger.error(error);
        process.exit(1);
      }
    });

  options.forEach(opt =>
    cmd.option(
      opt.name,
      opt.description,
      opt.parse || (val => val),
      typeof opt.default === "function" ? opt.default() : opt.default
    ));

  cmd._helpInformation = cmd.helpInformation.bind(cmd);
  cmd.helpInformation = function() {
    logger.clear();
    logger.printLogo(2);
    return this._helpInformation();
  };
});

program.command("*", null, { noHelp: true }).action(cmd => {
  logger.clear();
  logger.printLogo();
  logger.error(`:x:  Command '${cmd}' not recognized`);
  program.help();
});

program.version(pjson.version).parse(process.argv);
