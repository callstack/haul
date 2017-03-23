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

const ctx: Context = {
  console: console,
};

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

      command.action(ctx, argv, options);
    });

  options
    .forEach(opt => cmd.option(
      opt.name,
      opt.description,
      opt.parse || ((val) => val),
      typeof opt.default === 'function' ? opt.default(ctx) : opt.default,
    ));

});

program
  .command('*', null, { noHelp: true })
  .action((cmd) => {
    logger.clear();
    logger.printLogo();
    logger.error(`Command '${cmd}' not recognized`);
    program.help();
  });

program.version(pjson.version).parse(process.argv);
