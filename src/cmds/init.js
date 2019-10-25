const chalk = require('chalk');
const fs = require('fs');
const utils = require('../utils');

exports.command = 'init';
exports.desc = 'Creates a statickit.json file';
exports.builder = {};
exports.handler = function(args) {
  fs.writeFile('statickit.json', '{}', { flag: 'wx' }, function(err) {
    if (err) {
      utils.logSuccess('statickit.json already exists');
    } else {
      utils.logSuccess('statickit.json created');
    }
  });
};
