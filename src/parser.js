module.exports = require('yargs')
  .commandDir('cmds')
  .demandCommand()
  .help();
