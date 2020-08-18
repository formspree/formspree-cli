const fs = require('fs');

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
      logError('formspree.json could not be parsed');
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

module.exports = {
  readConfig,
  writeConfig
};
