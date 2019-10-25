const chalk = require('chalk');

const formatLine = str => {
  return `${chalk.gray('>')} ${str}`;
};

const formatError = msg => {
  return formatLine(chalk.red(msg));
};

module.exports = { formatLine, formatError };
