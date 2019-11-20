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

  if (!deployKey) {
    messages.authRequired();
    process.exitCode = 1;
    return;
  }

  log.progress(`Adding ${log.variable(args.name)} to your secrets...`);

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
        log.success(`Secret added`);
        return;

      case 401:
        log.error('Deploy key is not valid');
        process.exitCode = 1;
        return;

      case 422:
        response.data.errors.forEach(error => {
          if (
            error.field == 'key' &&
            error.message == 'has already been taken'
          ) {
            messages.secretAlreadyExists(args.name, args.value, deployKey);
          } else if (error.code == 'FORMAT' && error.field == 'key') {
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
