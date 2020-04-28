import { UserDependencyConfig } from '@react-native-community/cli';
var initCommand = require('./commands/init');
var bundleCommand = require('./commands/bundle');
var ramBundleCommand = require('./commands/ramBundle');
var startCommand = require('./commands/start');
var multiBundleCommand = require('./commands/multiBundle');

const pluginConfig: UserDependencyConfig = {
  commands: [
    initCommand,
    bundleCommand,
    ramBundleCommand,
    startCommand,
    multiBundleCommand,
  ],
};

module.exports = pluginConfig;
