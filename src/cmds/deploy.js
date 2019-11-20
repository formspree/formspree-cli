const chalk = require('chalk');
const deploy = require('@statickit/deploy');
const ora = require('ora');
const version = require('../../package.json').version;
const log = require('../log');
const messages = require('../messages');
const { stripIndent } = require('common-tags');

const indent = (text, depth = 2) => {
  return text
    .split('\n')
    .map(line => `${' '.repeat(depth)}${line}`)
    .join('\n');
};

const printErrors = errors => {
  console.log('');
  errors.forEach(printError);
  console.log('');
};

const printError = (error, idx) => {
  const [title, body] = errorMessage(error);
  console.error(`  ${`${idx + 1})`} ${title}`);

  if (body) {
    console.error('');
    console.error(indent(body, 7));
    console.error('');
  }
};

const errorMessage = error => {
  switch (error.code) {
    case 'SECRET_REQUIRED':
      // prettier-ignore
      var title = `The secret ${log.variable('@' + error.properties.key)} is not defined yet ${chalk.gray(`(${error.field})`)}`;
      let body;

      switch (error.properties.app) {
        case 'mailchimp':
          // prettier-ignore
          body = stripIndent`
            Here's where to find your API key:

              • Log in to your Mailchimp account
              • Open the menu with your avatar in the upper right
              • Navigate to ${chalk.bold.cyan('Profile › Extras › API keys')}
              • Under "Your API keys", click ${chalk.bold.cyan('Create A Key')}

            Copy the generated key and run the following command:

              ${chalk.gray('$')} statickit secrets add ${chalk.cyan(error.properties.key)} ${chalk.yellow('<paste-api-key-here>')}

            Then, try deploying again.
          `;

          break;

        default:
          // prettier-ignore
          body = stripIndent`
            Run the following command to add this secret:

              ${chalk.gray('$')} statickit secrets add ${chalk.cyan(error.properties.key)} ${chalk.yellow('<enter-the-value-here>')}

            Then, try deploying again.
          `;
          break;
      }

      return [title, body];

    default:
      var title = `${chalk.cyan(error.field)} ${error.message}`;
      return [title, ''];
  }
};

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

  log.preamble();

  if (!rawConfig) {
    log.error('Configuration not provided');
    process.exitCode = 1;
    return;
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    log.error('Configuration could not be parsed');
    process.exitCode = 1;
    return;
  }

  const key = deploy.getDeployKey(args);

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
        return;

      case 401:
        log.error('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 422:
        log.error(`Deployment failed ${chalk.gray(`(${response.data.id})`)}`);
        printErrors(response.data.errors);
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
    throw error;
  }
};
