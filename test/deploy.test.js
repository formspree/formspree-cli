const execa = require('execa');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

beforeEach(async () => {
  // Create a temp working directory, since some of the tests
  // need to create .env files and config files that might
  // conflict with what's in the root of this repo.
  await fs.mkdir('tmp');
});

afterEach(async () => {
  const files = await fs.readdir('tmp');

  // Delete all the files in the temp directory
  for (const file of files) {
    await fs.unlink(resolve(file));
  }

  await fs.rmdir('tmp');
});

const command = async (args, opts) => {
  return await execa.command(
    `../bin/statickit ${args}`,
    Object.assign({ cwd: 'tmp' }, opts)
  );
};

const resolve = file => {
  return path.resolve('tmp', file);
};

it('returns help output', async () => {
  const { stdout } = await command('--help');
  expect(stdout).toMatch(/Performs a deployment/);
});

it('returns an error if no config is present', async () => {
  try {
    await command('deploy');
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Configuration not provided/);
  }
});

it('returns an error if config is unparsable', async () => {
  try {
    await command(`deploy -c '{'`);
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Configuration could not be parsed/);
  }
});

it('returns an error if deploy key is not found', async () => {
  try {
    await command(`deploy -c '{}'`);
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Deploy key not found/);
  }
});

it('returns an error if deploy key is invalid', async () => {
  try {
    await command(`deploy -c '{}' -k invalidkey`);
  } catch (result) {
    console.log(result);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Deploy key is not valid/);
  }
});

it('succeeds given valid params', async () => {
  const { stdout } = await command(
    `deploy -c '{}' -k ${process.env.STATICKIT_TEST_DEPLOY_KEY}`
  );
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a deploy key from env', async () => {
  const { stdout } = await command(`deploy -c '{}'`, {
    env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
  });
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a deploy key from .env file', async () => {
  await fs.writeFile(
    resolve('.env'),
    `STATICKIT_DEPLOY_KEY=${process.env.STATICKIT_TEST_DEPLOY_KEY}`,
    'utf8'
  );

  const { stdout } = await command(`deploy -c '{}'`);
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a config from the statickit.json file', async () => {
  await fs.writeFile(resolve('statickit.json'), '{}', 'utf8');

  const { stdout } = await command('deploy', {
    env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
  });
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a config from a custom file', async () => {
  await fs.writeFile(resolve('statickit-custom.json'), '{}', 'utf8');

  const { stdout } = await command('deploy -A statickit-custom.json', {
    env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
  });
  expect(stdout).toMatch(/Deployment succeeded/);
});
