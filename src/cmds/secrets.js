exports.command = 'secrets <command>';
exports.desc = 'Manage site secrets';
exports.builder = yargs => {
  return yargs.commandDir('secrets_cmds');
};
exports.handler = _argv => {};
