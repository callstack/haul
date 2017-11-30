const exec = require('child_process').exec;
const clear = require('clear');

const logger = require('../../../../logger');
const messages = require('../../../../messages');

module.exports = port => {
  const args = `reverse tcp:${port} tcp:${port}`;
  const adb = process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';

  clear();
  exec(`${adb} ${args}`, errorObject => {
    if (errorObject) {
      // get just the error message
      const error = errorObject.message.split('error:')[1];

      logger.warn(
        messages.commandFailed({
          command: `${adb} ${args}`,
          error: new Error(error),
        })
      );
      return;
    }
    logger.info(
      messages.commandSuccess({
        command: `${adb} ${args}`,
      })
    );
  });
};
