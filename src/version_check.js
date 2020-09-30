const pacote = require('pacote');
const chalk = require('chalk');
const ora = require('ora');
const installedVersion = require('../package.json').version;
const log = require('./log');

module.exports = async () => {
  const spinner = ora(chalk.gray('Checking version...'));

  spinner.start();

  try {
    const manifest = await pacote.manifest('@formspree/cli@latest');
    const newVersion = manifest.version;
    spinner.stop();

    if (installedVersion !== newVersion) {
      console.log('');

      log.progress(
        `${chalk.yellow.bold('Update Available!')} ${chalk.gray(
          `v${installedVersion} ➜ v${newVersion}`
        )}\n  Run ${log.variable(
          'npm i --save-dev @formspree/cli@latest'
        )} to update.\n`
      );
    }
  } catch (e) {
    spinner.stop();
    log.meta('Version check failed');
  }
};
