const fs = require('fs');
const log = require('../log');

exports.command = 'init';
exports.desc = 'Creates a formspree.json file';
exports.builder = {};

exports.handler = _args => {
  fs.writeFile('formspree.json', '{}', { flag: 'wx' }, function(err) {
    if (err) {
      log.success('formspree.json already exists');
    } else {
      log.success('formspree.json created');
    }
  });
};
