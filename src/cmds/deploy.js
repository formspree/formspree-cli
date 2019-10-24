const chalk = require('chalk');
const deploy = require('@statickit/deploy');
const ora = require('ora');
const version = require('../../package.json').version;

const setErrorExit = () => {
  process.exitCode = 1;
};

const formatLine = str => {
  return `${chalk.gray('>')} ${str}`;
};

const formatError = msg => {
  return formatLine(chalk.red(msg));
};

exports.command = 'deploy';

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
    console.error(formatError('Configuration not provided'));
    setErrorExit();
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    console.error(formatError('Configuration could not be parsed'));
    setErrorExit();
    return;
  }

  const key = deploy.getDeployKey(args);

  if (!key) {
    console.error(formatError('Deploy key not found'));
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
        console.log(formatLine(chalk.green('Deployment succeeded')));
        console.log(formatLine(chalk.gray('id: ' + response.data.id)));
        return;

      case 401:
        console.error(formatError('Deploy key is not valid'));
        setErrorExit();
        return;

      case 422:
        console.error(
          formatError('Deployment failed due to configuration errors')
        );
        console.log('');
        console.table(response.data.errors);
        console.log('');
        console.log(formatLine(chalk.gray('id: ' + response.data.id)));
        setErrorExit();
        return;

      default:
        console.error(formatError('Deployment failed'));
        setErrorExit();
        return;
    }
  } catch (error) {
    spinner.stop();
    console.error(formatError('Deployment failed unexpectedly'));
    setErrorExit();
    throw error;
  }
};
