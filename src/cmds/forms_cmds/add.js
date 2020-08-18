const utils = require('../../utils');
const log = require('../../log');

exports.command = 'add <key> <name>';
exports.desc = 'Adds a new form to config';

exports.builder = yargs => {
  yargs.option('file', {
    describe: 'Path to the local `formspree.json` file',
    default: 'formspree.json'
  });
};

exports.handler = args => {
  const config = utils.readConfig(args.file);
  const forms = config.forms || (config.forms = {});

  if (forms[args.key]) {
    log.error(`${log.variable(args.key)} already exists`);
  } else {
    forms[args.key] = { name: args.name };
    utils.writeConfig(args.file, config);
    log.success(`${log.variable(args.key)} added`);
  }
};
