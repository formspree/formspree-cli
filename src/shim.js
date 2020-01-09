const fs = require('fs');
const execa = require('execa');

const install = async ref => {
  if (fs.existsSync('yarn.lock')) {
    await execa('yarn', ['add', ref]);
  } else {
    await execa('npm', ['install', ref]);
  }
};

module.exports = { install };
