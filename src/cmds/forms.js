exports.command = 'forms <command>';
exports.desc = 'Helpers for managing forms';
exports.builder = function(yargs) {
  return yargs.commandDir('forms_cmds');
};
exports.handler = function(argv) {};
