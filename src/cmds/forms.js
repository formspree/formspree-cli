exports.command = 'forms <command>';
exports.desc = 'Helpers for managing forms';
exports.builder = yargs => {
  return yargs.commandDir('forms_cmds');
};
exports.handler = _argv => {};
