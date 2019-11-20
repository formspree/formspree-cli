require('dotenv').config();

const log = require('./log');
const versionCheck = require('./version_check');

require('yargs')
  .commandDir('cmds')
  .demandCommand()
  .help()
  .option('skip-version-check', {
    type: 'boolean',
    describe: 'Skip checking the npm registry for updates'
  })
  .middleware(args => {
    log.preamble();

    if (!args.skipVersionCheck) {
      return versionCheck();
    }

    return {};
  }).argv;
