const fs = require('fs');
const chalk = require('chalk');

const readRawConfigSync = () => {
  try {
    return fs.readFileSync('statickit.json', 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    } else {
      throw err;
    }
  }
};

const parseRawConfig = rawConfig => {
  try {
    const json = JSON.parse(rawConfig);
    return json;
  } catch (err) {
    return null;
  }
};

exports.builder = {};

exports.handler = _args => {
  const rawConfig = readRawConfigSync();

  if (!rawConfig) {
    console.error(chalk.bold.red('statickit.json does not exist'));
    process.exitCode = 1;
    return;
  }

  const config = parseRawConfig(rawConfig);

  if (!config) {
    console.error(chalk.bold.red('statickit.json could not be parsed'));
    process.exitCode = 1;
    return;
  }

  console.log(`Config: ${rawConfig}`);
};
