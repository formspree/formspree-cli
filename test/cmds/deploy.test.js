const deploy = require('@statickit/deploy');
const version = require('../../package.json').version;

jest.mock('process', () => ({ env: {} }));
jest.mock('@statickit/deploy');

const cmd = require('../../src/cmds/deploy');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

it('sends a deploy request with the right params', async () => {
  const config = { forms: { newsletter: { name: 'Newsletter' } } };
  const args = { config: JSON.stringify(config), key: 'xxx' };

  deploy.getRawConfig.mockImplementation(args => args.config);
  deploy.getDeployKey.mockImplementation(args => args.key);

  deploy.request.mockImplementation(params => {
    expect(params.config).toStrictEqual(config);
    expect(params.key).toBe('xxx');
    expect(params.userAgent).toBe(`@statickit/cli@${version}`);

    return Promise.resolve({ status: 200, data: { id: 'xxxx-xxxx-xxxx' } });
  });

  await cmd.handler(args);
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('displays instructions for a missing mailchimp api keys', async () => {
  const config = {};
  const args = { config: JSON.stringify(config), key: 'xxx' };

  deploy.getRawConfig.mockImplementation(args => args.config);
  deploy.getDeployKey.mockImplementation(args => args.key);

  deploy.request.mockImplementation(_params => {
    return Promise.resolve({
      status: 422,
      data: {
        id: 'xxxx-xxxx-xxxx',
        errors: [
          {
            code: 'SECRET_REQUIRED',
            field: 'actions[0].apiKey',
            message: 'is required',
            properties: {
              secret_type: 'mailchimp_api_key',
              secret_key: 'my-mailchimp-key'
            }
          }
        ]
      }
    });
  });

  await cmd.handler(args);
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays instructions when a secret reference is required', async () => {
  const config = {};
  const args = { config: JSON.stringify(config), key: 'xxx' };

  deploy.getRawConfig.mockImplementation(args => args.config);
  deploy.getDeployKey.mockImplementation(args => args.key);

  deploy.request.mockImplementation(_params => {
    return Promise.resolve({
      status: 422,
      data: {
        id: 'xxxx-xxxx-xxxx',
        errors: [
          {
            code: 'SECRET_REFERENCE_REQUIRED',
            field: 'actions[0].apiKey',
            message: 'must reference a secret (e.g. @mailchimp-api-key)',
            properties: {
              example_value: 'mailchimp-api-key',
              given_value: 'myinlinekey'
            }
          }
        ]
      }
    });
  });

  await cmd.handler(args);
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays general validation errors', async () => {
  const config = {};
  const args = { config: JSON.stringify(config), key: 'xxx' };

  deploy.getRawConfig.mockImplementation(args => args.config);
  deploy.getDeployKey.mockImplementation(args => args.key);

  deploy.request.mockImplementation(_params => {
    return Promise.resolve({
      status: 422,
      data: {
        id: 'xxxx-xxxx-xxxx',
        errors: [
          {
            code: 'REQUIRED',
            field: 'name',
            message: 'is required',
            properties: {}
          }
        ]
      }
    });
  });

  await cmd.handler(args);
  expect(console.error.mock.calls).toMatchSnapshot();
});
