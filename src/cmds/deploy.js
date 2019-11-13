const chalk = require('chalk');
const deploy = require('@statickit/deploy');
const ora = require('ora');
const version = require('../../package.json').version;
const utils = require('../utils');

exports.command = 'deploy';
exports.describe = 'Deploys statickit.json';

exports.builder = yargs => {
  yargs.option('config', {
    alias: 'c',
    describe: 'Site configuration'
  });

  yargs.option('key', {
    alias: 'k',
    describe: 'Deploy key'
  });

  yargs.option('endpoint', {
    alias: 'e',
    describe: 'API endpoint'
  });

  yargs.option('file', {
    describe: 'Path to the local `statickit.json` file',
    default: 'statickit.json'
  });
};

exports.handler = async args => {
  const rawConfig = deploy.getRawConfig(args);
  const endpoint = args.endpoint || 'https://api.statickit.com';
  const userAgent = `@statickit/cli@${version}`;
  const spinner = ora(chalk.gray('Deploying...'));

  utils.preamble();

  if (!rawConfig) {
    utils.logError('Configuration not provided');
    process.exitCode = 1;
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    utils.logError('Configuration could not be parsed');
    process.exitCode = 1;
    return;
  }

  const key = deploy.getDeployKey(args);

  if (!key) {
    utils.logError('Deploy key not found');
    process.exitCode = 1;
    return;
  }

  spinner.start();

  try {
    const response = await deploy.request({
      endpoint,
      config,
      key,
      userAgent
    });

    spinner.stop();

    switch (response.status) {
      case 200:
        utils.logSuccess('Deployment succeeded');
        utils.logMeta(`id: ${response.data.id}`);
        return;

      case 401:
        utils.logError('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 422:
        utils.logError('Deployment failed due to configuration errors');
        console.log('');
        console.table(response.data.errors);
        console.log('');
        utils.logMeta(`id: ${response.data.id}`);
        process.exitCode = 1;
        return;

      default:
        utils.logError('Deployment failed');
        process.exitCode = 1;
        return;
    }
  } catch (error) {
    spinner.stop();
    utils.logError('Deployment failed unexpectedly');
    process.exitCode = 1;
    throw error;
  }
};
