const chalk = require('chalk');
const utils = require('../../utils');

exports.command = 'add <key> <name>';
exports.desc = 'Adds a new form to config';

exports.builder = yargs => {
  yargs.option('file', {
    describe: 'Path to the local `statickit.json` file',
    default: 'statickit.json'
  });
};

exports.handler = args => {
  const config = utils.readConfig(args.file);
  const forms = config.forms || (config.forms = {});
  const coloredKey = chalk.cyan(`\`${args.key}\``);

  if (forms[args.key]) {
    utils.logError(`${coloredKey} already exists`);
  } else {
    forms[args.key] = { name: args.name };
    utils.writeConfig(args.file, config);
    utils.logSuccess(`${coloredKey} added`);
  }
};
