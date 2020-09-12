const chalk = require('chalk');
const deploy = require('@formspree/deploy');
const ora = require('ora');
const version = require('../../package.json').version;
const log = require('../log');
const messages = require('../messages');
const env = require('process').env;
const { traverse } = require('../traverse');

const printErrors = ({ code, errors }) => {
  switch (code) {
    case 'CONFIG_VALIDATION_ERROR':
      console.error('');
      errors.forEach((error, idx) => {
        console.error(
          `  ${`${idx + 1})`} ${chalk.cyan(error.field)} ${error.message}`
        );
      });
      console.error('');
      break;

    default:
      console.error('');
      errors.forEach((error, idx) => {
        console.error(`  ${`${idx + 1})`} ${error.message}`);
      });
      console.error('');
      break;
  }
};

const printDeployLog = ({ log }) => {
  if (!log) return;

  console.log('');
  log.forEach((item, idx) => {
    console.log(`  ${`${idx + 1})`} ${item}`);
  });
  console.log('');
};

exports.command = 'deploy';
exports.describe = 'Deploys formspree.json';

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

  yargs.option('force', {
    alias: 'f',
    describe: 'Skip verifying that secrets reference environment variables',
    type: 'boolean',
    default: false
  });

  yargs.option('file', {
    describe: 'Path to the local `formspree.json` file',
    default: 'formspree.json'
  });
};

exports.handler = async args => {
  const rawConfig = args.config || deploy.getRawConfig(args);
  const endpoint = args.endpoint || 'https://formspree.io';
  const userAgent = `@formspree/cli@${version}`;
  const spinner = ora(chalk.gray('Deploying...'));

  if (!rawConfig) {
    log.error('Configuration not provided');
    process.exitCode = 1;
    return;
  }

  let parsedRawConfig;

  try {
    parsedRawConfig = JSON.parse(rawConfig);
  } catch (err) {
    log.error('Configuration could not be parsed');
    process.exitCode = 1;
    return;
  }

  // Traverse the config and validate that certain specially-named keys
  // reference environment variables.
  let invalidKeys = [];
  const sensitiveKeys = ['apiKey', 'apiSecret', 'secretKey', 'apiToken'];

  traverse(parsedRawConfig, (key, value) => {
    if (
      sensitiveKeys.indexOf(key) > -1 &&
      !value.match(/^\$([A-Za-z0-9_]+)$/)
    ) {
      invalidKeys.push(key);
    }
  });

  if (!args.force && invalidKeys.length > 0) {
    log.error(
      `The following properties must reference environment variables: ${invalidKeys.join(
        ', '
      )}`
    );

    log.meta('To override this, use the `-f` flag.');

    process.exitCode = 1;
    return;
  }

  // Replace environment variable $-references with the actual values
  // If the environment variable is not defined, store in an array an present
  // an error to the user.
  let undefinedEnvRefs = [];

  const rawConfigWithSecrets = rawConfig.replace(
    /\$([A-Za-z0-9_]+)/gi,
    (_match, variableName) => {
      let value = env[variableName];
      if (value) return value;
      undefinedEnvRefs.push(variableName);
    }
  );

  if (undefinedEnvRefs.length > 0) {
    log.error(
      `The following environment variables were referenced but are not defined: ${undefinedEnvRefs.join(
        ', '
      )}`
    );

    process.exitCode = 1;
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfigWithSecrets);
  } catch (err) {
    log.error('Configuration could not be parsed');
    process.exitCode = 1;
    return;
  }

  const key = args.key || deploy.getDeployKey(args);

  if (!key) {
    messages.authRequired();
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
        log.success(
          `Deployment succeeded ${chalk.gray(`(${response.data.id})`)}`
        );
        printDeployLog(response.data);
        return;

      case 401:
        log.error('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 422:
        log.error(`Deployment failed`);
        printErrors(response.data);
        process.exitCode = 1;
        return;

      default:
        log.error('Deployment failed');
        process.exitCode = 1;
        return;
    }
  } catch (error) {
    spinner.stop();
    log.error('Deployment failed unexpectedly');
    process.exitCode = 1;
    return;
  }
};
