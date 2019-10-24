require('dotenv').config();

const execa = require('execa');
const path = require('path');
const fs = require('fs').promises;

// Execute the `statickit` command from the root directory
// Tests that use this should not rely on the contents of the
// file system (e.g. a statickit.json file).
const command = async (args, opts) => {
  return await execa.command(`bin/statickit ${args}`, opts);
};

// Execute the `statickit` command from the sandbox directory
const sandboxCommand = async (args, opts) => {
  return await execa.command(
    `../bin/statickit ${args}`,
    Object.assign({ cwd: 'tmp' }, opts)
  );
};

// Resolve path to file in the working directory for the command
const resolveSandbox = file => {
  return path.resolve('tmp', file);
};

// Create a sandbox directory to serve a the command working directory,
// since tests that interact with the file system conflict with files
// in the repo.
const makeSandbox = async () => {
  await fs.mkdir('tmp');
};

const removeSandbox = async () => {
  const files = await fs.readdir('tmp');

  // Delete all the files in the temp directory
  for (const file of files) {
    await fs.unlink(resolveSandbox(file));
  }

  await fs.rmdir('tmp');
};

module.exports = {
  command,
  sandboxCommand,
  resolveSandbox,
  makeSandbox,
  removeSandbox
};
