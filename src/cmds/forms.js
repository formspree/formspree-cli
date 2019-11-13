exports.command = 'forms <command>';
exports.desc = 'Manage form resources';
exports.builder = yargs => {
  return yargs.commandDir('forms_cmds');
};
exports.handler = _argv => {};
