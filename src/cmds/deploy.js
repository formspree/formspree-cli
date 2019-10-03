const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');
const ora = require('ora');

const readConfigFromFile = () => {
  try {
    return fs.readFileSync('statickit.json', 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    } else {
      throw err;
    }
  }
};

const parseConfig = rawConfig => {
  try {
    const json = JSON.parse(rawConfig);
    return json;
  } catch (err) {
    return null;
  }
};

const getConfig = args => {
  if (args.config) return args.config;
  return readConfigFromFile();
};

const getDeployKey = args => {
  if (args.key) return args.key;
  return process.env.STATICKIT_DEPLOY_KEY;
};

exports.command = ['deploy', '$0'];

exports.describe = 'Performs a deployment';

exports.builder = yargs => {
  yargs.option('config', {
    alias: 'c',
    describe: `Site configuration`
  });

  yargs.option('key', {
    alias: 'k',
    describe: `Deploy key`
  });
};

exports.handler = async args => {
  const rawConfig = getConfig(args);
  const spinner = ora(chalk.gray('Deploying...'));

  if (!rawConfig) {
    console.error(chalk.bold.red('Configuration not provided'));
    process.exitCode = 1;
    return;
  }

  const config = parseConfig(rawConfig);

  if (!config) {
    console.error(chalk.bold.red('Configuration could not be parsed'));
    process.exitCode = 1;
    return;
  }

  const deployKey = getDeployKey(args);

  if (!deployKey) {
    console.error(chalk.bold.red('Deploy key not found'));
    return;
  }

  spinner.start();

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.statickit.com/cli/v1/deployments',
      data: config,
      headers: {
        'StaticKit-Deploy-Key': deployKey,
        'User-Agent': 'StaticKit CLI/1.0.0-beta.0'
      },
      validateStatus: status => status < 500
    });

    spinner.stop();

    switch (response.status) {
      case 200:
        console.log(chalk.green('Deployment succeeded'));
        return;

      case 401:
        console.error(chalk.red('Deploy key is not valid'));
        return;

      case 422:
        console.error(chalk.red('Deployment failed with errors:'));
        console.error(response.data.errors);
        return;

      default:
        console.error(chalk.red('Deployment failed'));
        return;
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Deployment failed'));
    throw error;
  }
};
