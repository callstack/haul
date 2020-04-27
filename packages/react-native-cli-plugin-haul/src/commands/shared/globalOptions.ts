import { getBoolFromString } from "./parsers";

const globalOptions = [
  {
    name: "output-file <filename>",
    describe: "Log all messages to a file.",
  },
  {
    name: "json",
    describe: "When --output-file is set, log each message as a JSON object.",
    parse: getBoolFromString,
  },
  {
    name: "verbose",
    describe: "Print all logs including debug messages.",
    parse: getBoolFromString,
  },
  {
    name: 'node-inspector <true|false|"wait">',
    describe: "Print all logs including debug messages.",
    parse: (val: string) => {
      if (val === "wait") return val;
      return val === "true";
    },
  },
];

export default globalOptions;
