const path = require('path');

const LoadRnCli = {
  extraPlatforms(directory) {
    const { getPlatforms } = LoadRnCli.loadRnCli(directory);
    if (typeof getPlatforms === 'function') {
      return getPlatforms();
    }
    return [];
  },

  extraPlatformsDescriptions(directory) {
    return LoadRnCli.extraPlatforms(directory).map(platform => {
      return {
        value: platform,
        description: `Builds ${platform} bundle`,
      };
    });
  },

  extraProvidesModuleNodeModules(directory) {
    const { getProvidesModuleNodeModules } = LoadRnCli.loadRnCli(directory);
    if (typeof getProvidesModuleNodeModules === 'function') {
      return [...getProvidesModuleNodeModules()].reverse();
    }
    return [];
  },

  loadRnCli(directory = process.cwd()) {
    try {
      const rnCliConfigPath = path.resolve(directory, 'rn-cli.config.js');
      return require(rnCliConfigPath);
    } catch (error) {
      return {};
    }
  },
};

module.exports = LoadRnCli;
