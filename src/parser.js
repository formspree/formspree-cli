const parser = require('yargs');

module.exports = parser
  .scriptName('statickit')
  .usage('$0 <command> [options]')
  .command(require('./cmds/deploy'))
  .help();
