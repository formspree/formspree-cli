const deploy = require('@statickit/deploy');
const axios = require('axios');
const utils = require('../../utils');
const version = require('../../../package.json').version;

const humanizeField = name => {
  switch (name) {
    case 'key':
      return 'Name';
    case 'value':
      return 'Value';
    default:
      return name;
  }
};

exports.command = 'add <name> <value>';
exports.desc = 'Adds a secret';

exports.builder = yargs => {
  yargs.option('key', {
    alias: 'k',
    describe: 'Deploy key'
  });

  yargs.option('endpoint', {
    alias: 'e',
    describe: 'API endpoint'
  });
};

exports.handler = async args => {
  const deployKey = deploy.getDeployKey(args);
  const endpoint = args.endpoint || 'https://api.statickit.com';
  const userAgent = `@statickit/cli@${version}`;

  utils.preamble();

  if (!deployKey) {
    utils.logError('Deploy key not found');
    process.exitCode = 1;
    return;
  }

  utils.logProgress(
    `Adding ${utils.colorVariable(args.name)} to your secrets...`
  );

  try {
    const response = await axios({
      method: 'post',
      url: `${endpoint}/cli/v1/secrets`,
      data: {
        key: args.name,
        value: args.value
      },
      headers: {
        'StaticKit-Deploy-Key': deployKey,
        'User-Agent': userAgent
      },
      validateStatus: status => status < 500
    });

    switch (response.status) {
      case 200:
        utils.logSuccess(`${coloredName} added to secrets`);
        return;

      case 401:
        utils.logError('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 422:
        response.data.errors.forEach(error => {
          if (
            error.field == 'key' &&
            error.message == 'has already been taken'
          ) {
            utils.logError(
              'This secret already exists. Use `statickit secrets update` to update it.'
            );
          } else {
            utils.logError(`${humanizeField(error.field)} ${error.message}`);
          }
        });

        process.exitCode = 1;
        return;
    }
  } catch (error) {
    utils.logError('Request failed unexpectedly');
    process.exitCode = 1;
    throw error;
  }
};
