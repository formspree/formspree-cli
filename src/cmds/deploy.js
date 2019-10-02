const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');

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
    describe: `Site config (overrides ${chalk.gray(
      '`statickit.json`'
    )} file contents)`
  });

  yargs.option('deploy-key', {
    alias: 'k',
    describe: `Deploy key (overrides ${chalk.gray(
      '`STATICKIT_DEPLOY_KEY`'
    )} env variable)`
  });
};

exports.handler = async args => {
  const rawConfig = getConfig(args);

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

    if (response.status == 200) {
      console.log(chalk.bold.green('Deployment succeeded'));
    } else if (response.status == 422) {
      console.error(chalk.bold.red('Deployment failed with errors:'));
      console.error(response.data.errors);
    } else {
      console.error(chalk.bold.red('Deployment failed'));
    }
  } catch (error) {
    console.error(chalk.bold.red('Deployment failed'));
  }
};
