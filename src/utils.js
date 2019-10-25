const chalk = require('chalk');
const fs = require('fs');

const withCaret = str => {
  return `${chalk.gray('>')} ${str}`;
};

/**
 * Logs a green success message to stdout.
 *
 * @param {string} msg
 */
const logSuccess = msg => {
  return console.log(withCaret(chalk.green(msg)));
};

/**
 * Logs a subtle gray message to stdout.
 *
 * @param {string} msg
 */
const logMeta = msg => {
  return console.log(withCaret(chalk.gray(msg)));
};

/**
 * Logs a red error message to stderr.
 *
 * @param {string} msg
 */
const logError = msg => {
  return console.error(withCaret(chalk.red(msg)));
};

/**
 * Reads a config file and parses it's contents as JSON.
 * If the file does not exist, returns an empty object.
 * Throws an error if a parsing error occurs.
 *
 * @param {string} file
 */
const readConfig = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    } else {
      logError('statickit.json could not be parsed');
      throw err;
    }
  }
};

/**
 * Stringifys the given config object to pretty JSON and
 * writes it to the given file path.
 *
 * @param {string} file
 * @param {object} config
 */
const writeConfig = (file, config) => {
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
};

module.exports = { logSuccess, logMeta, logError, readConfig, writeConfig };
