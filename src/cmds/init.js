const { formatLine } = require('../output');
const chalk = require('chalk');
const fs = require('fs');

const logSuccess = msg => {
  console.log(formatLine(chalk.green(msg)));
};

exports.command = 'init';
exports.desc = 'Create a statickit.json file in the current directory';
exports.builder = {};
exports.handler = function(args) {
  fs.writeFile('statickit.json', '{}', { flag: 'wx' }, function(err) {
    if (err) {
      logSuccess('statickit.json already exists');
    } else {
      logSuccess('statickit.json created');
    }
  });
};
