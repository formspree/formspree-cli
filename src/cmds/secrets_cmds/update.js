const deploy = require('@statickit/deploy');
const axios = require('axios');
const log = require('../../log');
const messages = require('../../messages');
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

exports.command = 'update <name> [value]';
exports.desc = 'Updates a secret value';

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

  if (!deployKey) {
    messages.authRequired();
    process.exitCode = 1;
    return;
  }

  log.progress(`Updating ${log.variable(args.name)}...`);

  try {
    const response = await axios({
      method: 'patch',
      url: `${endpoint}/cli/v1/secrets/${args.name}`,
      data: {
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
        log.success(`Secret updated`);
        return;

      case 401:
        log.error('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 404:
        log.error('Secret not found');
        process.exitCode = 1;
        return;

      case 422:
        response.data.errors.forEach(error => {
          if (error.code == 'FORMAT' && error.field == 'key') {
            messages.secretKeyInvalid();
          } else {
            log.error(`${humanizeField(error.field)} ${error.message}`);
          }
        });

        process.exitCode = 1;
        return;
    }
  } catch (error) {
    log.error('Request failed unexpectedly');
    process.exitCode = 1;
    throw error;
  }
};
