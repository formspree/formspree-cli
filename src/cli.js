require('dotenv').config();

require('yargs')
  .commandDir('cmds')
  .demandCommand()
  .help().argv;
