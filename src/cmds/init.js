const fs = require('fs');
const log = require('../log');

exports.command = 'init';
exports.desc = 'Creates a statickit.json file';
exports.builder = {};
exports.handler = _args => {
  fs.writeFile('statickit.json', '{}', { flag: 'wx' }, function(err) {
    if (err) {
      log.success('statickit.json already exists');
    } else {
      log.success('statickit.json created');
    }
  });
};
