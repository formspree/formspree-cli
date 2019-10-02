const argv = require('yargs');
const deploy = require('./cmds/deploy');

argv
  .scriptName('statickit')
  .usage('$0 <command> [options]')
  .command(deploy)
  .help().argv;
