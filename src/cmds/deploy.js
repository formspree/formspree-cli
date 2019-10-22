const chalk = require('chalk');
const deploy = require('@statickit/deploy');
const ora = require('ora');
const version = require('../../package.json').version;

const setErrorExit = () => {
  process.exitCode = 1;
};

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
    setErrorExit();
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    console.error(chalk.bold.red('Configuration could not be parsed'));
    setErrorExit();
    return;
  }

  const key = deploy.getDeployKey(args);

  if (!key) {
    console.error(chalk.bold.red('Deploy key not found'));
    setErrorExit();
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
        setErrorExit();
        return;

      case 422:
        console.error(
          `--> ${chalk.red('Deployment failed due to configuration errors')}`
        );
        console.log('');
        console.table(response.data.errors);
        console.log('');
        console.log(`${chalk.gray('id: ' + response.data.id)}`);
        setErrorExit();
        return;

      default:
        console.error(`--> ${chalk.red('Deployment failed')}`);
        setErrorExit();
        return;
    }
  } catch (error) {
    spinner.stop();
    console.error(`--> ${chalk.red('Deployment failed unexpectedly')}`);
    setErrorExit();
    throw error;
  }
};
