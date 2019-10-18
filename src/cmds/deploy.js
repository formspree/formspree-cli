const chalk = require('chalk');
const deploy = require('@statickit/deploy');
const ora = require('ora');
const version = require('../../package.json').version;

exports.command = ['deploy', '$0'];

exports.describe = 'Performs a deployment';

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
    alias: 'A',
    describe: 'Path to the local `statickit.json` file',
    default: 'statickit.json'
  });
};

exports.handler = async args => {
  const rawConfig = deploy.getRawConfig(args);
  const endpoint = args.endpoint || 'https://api.statickit.com';
  const userAgent = `@statickit/cli@${version}`;
  const spinner = ora(chalk.gray('Deploying...'));

  if (!rawConfig) {
    console.error(chalk.bold.red('Configuration not provided'));
    process.exitCode = 1;
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    console.error(chalk.bold.red('Configuration could not be parsed'));
    process.exitCode = 1;
    return;
  }

  const key = deploy.getDeployKey(args);

  if (!key) {
    console.error(chalk.bold.red('Deploy key not found'));
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
        console.log(`--> ${chalk.green('Deployment succeeded')}`);
        console.log(`${chalk.gray('id: ' + response.data.id)}`);
        return;

      case 401:
        console.error(`--> ${chalk.red('Deploy key is not valid')}`);
        return;

      case 422:
        console.error(
          `--> ${chalk.red('Deployment failed due to configuration errors')}`
        );
        console.log('');
        console.table(response.data.errors);
        console.log('');
        console.log(`${chalk.gray('id: ' + response.data.id)}`);
        return;

      default:
        console.error(`--> ${chalk.red('Deployment failed')}`);
        return;
    }
  } catch (error) {
    spinner.stop();
    console.error(`--> ${chalk.red('Deployment failed unexpectedly')}`);
    throw error;
  }
};
