const fs = require('fs').promises;

const {
  command,
  makeSandbox,
  removeSandbox,
  sandboxCommand,
  resolveSandbox
} = require('./helpers');

describe('using file system', () => {
  beforeEach(async () => {
    await makeSandbox();
  });

  afterEach(async () => {
    await removeSandbox();
  });

  it('returns an error if no config is present', async () => {
    try {
      await sandboxCommand('deploy');
    } catch (result) {
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Configuration not provided/);
    }
  });

  it('accepts a deploy key from .env file', async () => {
    await fs.writeFile(
      resolveSandbox('.env'),
      `STATICKIT_DEPLOY_KEY=${process.env.STATICKIT_TEST_DEPLOY_KEY}`,
      'utf8'
    );

    const { stdout, exitCode } = await sandboxCommand(`deploy -c '{}'`);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Deployment succeeded/);
  });

  it('accepts a config from the statickit.json file', async () => {
    await fs.writeFile(resolveSandbox('statickit.json'), '{}', 'utf8');

    const { stdout, exitCode } = await sandboxCommand('deploy', {
      env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
    });
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Deployment succeeded/);
  });

  it('accepts a config from a custom file', async () => {
    await fs.writeFile(resolveSandbox('statickit-custom.json'), '{}', 'utf8');

    const { stdout, exitCode } = await sandboxCommand(
      'deploy --file statickit-custom.json',
      {
        env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
      }
    );
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Deployment succeeded/);
  });
});

describe('using args', () => {
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
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Deploy key is not valid/);
    }
  });

  it('succeeds given valid params', async () => {
    const { stdout, exitCode } = await command(
      `deploy -c '{}' -k ${process.env.STATICKIT_TEST_DEPLOY_KEY}`
    );
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Deployment succeeded/);
  });

  it('accepts a deploy key from env', async () => {
    const { stdout, exitCode } = await command(`deploy -c '{}'`, {
      env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
    });
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Deployment succeeded/);
  });

  it('fails given invalid params', async () => {
    try {
      await command(
        `deploy -c '{"forms":{"a":{"name":""}}}' -k ${process.env.STATICKIT_TEST_DEPLOY_KEY}`
      );
    } catch (result) {
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(
        /Deployment failed due to configuration errors/
      );
    }
  });
});
