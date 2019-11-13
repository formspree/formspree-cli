const chalk = require('chalk');
const log = require('./log');
const { stripIndent } = require('common-tags');

const authRequired = () => {
  log.error('Deploy key is required');
  console.error('');

  // prettier-ignore
  console.error(stripIndent`
    Your deploy key can be found under "Settings" in the UI.
    There are couple ways to use your key:

    - Use the ${log.variable('-k')} flag, or
    - Set the ${log.variable('STATICKIT_DEPLOY_KEY')} env variable

    ${chalk.yellow.bold('-- Examples -----------------------------------------------')}

    The inline method looks like this:

      ${chalk.gray('$')} statickit deploy ${chalk.cyan('-k')} c4cf8a3b6cc15b9ea0817e4fa00cb036

    For convenience, you can add it to a ${log.variable('.env')} file.
    That way, you don't have to copy/paste it every time
    you run a command:

      ${chalk.gray('$')} echo "${chalk.gray('STATICKIT_DEPLOY_KEY=c4cf8a3b6cc...')}" >> .env
      ${chalk.gray('$')} statickit deploy

    Just be sure to add ${log.variable('.env')} to your ${log.variable('.gitignore')} file,
    so your deploy key does not end up in version control.
  `);

  console.error('');
};

module.exports = { authRequired };
