/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */
const program = require("commander");
const pjson = require("../../package.json");

import type { Command, Context } from "../types";

const commands: Array<Command> = [require("./start")];

const ctx: Context = {};

commands.forEach(cmd => {
  program
    .command(cmd.name)
    .description(cmd.description)
    .action(() => cmd.action(ctx));
});

program.version(pjson.version).parse(process.argv);
