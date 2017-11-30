const exec = require('child_process').exec;
const path = require('path');

const logger = require('../../../../logger');
const messages = require('../../../../messages');

module.exports = async port => {
  const args = `reverse tcp:${port} tcp:${port}`;
  const adb = process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';

  try {
    await exec(`${adb} ${args}`);
    logger.info(
      messages.commandSuccess({
        command: `${path.basename(adb)} ${args}`,
      })
    );
  } catch (error) {
    logger.warn(
      messages.commandFailed({
        command: `${path.basename(adb)} ${args}`,
        error,
      })
    );
  }
};
