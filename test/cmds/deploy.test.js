const deploy = require('@statickit/deploy');
const version = require('../../package.json').version;

jest.mock('process', () => ({
  env: { MY_SECRET: 'pa$$w0rd', API_KEY: '12345' }
}));
jest.mock('@statickit/deploy');
jest.mock('../../src/shim');

jest.mock('ora', () => {
  return () => ({
    start: jest.fn(),
    stop: jest.fn()
  });
});

const cmd = require('../../src/cmds/deploy');
const shim = require('../../src/shim');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  shim.install.mockReset();
  deploy.request.mockReset();
});

it('sends a deploy request with the right params', async () => {
  deploy.request.mockImplementation(params => {
    expect(params.config).toStrictEqual({});
    expect(params.key).toBe('xxx');
    expect(params.userAgent).toBe(`@statickit/cli@${version}`);

    return Promise.resolve({ status: 200, data: { id: 'xxxx-xxxx-xxxx' } });
  });

  await cmd.handler({ config: '{}', key: 'xxx' });
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('installs the shim if present in the response', async () => {
  deploy.request.mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: 'shim-ref' }
    });
  });

  await cmd.handler({ config: '{}', key: 'xxx', shim: true });
  expect(shim.install).toHaveBeenCalledWith('shim-ref');
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('does not install the shim if not present in the response', async () => {
  deploy.request.mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: null }
    });
  });

  await cmd.handler({ config: '{}', key: 'xxx', shim: true });
  expect(shim.install).not.toHaveBeenCalled();
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('does not install the shim if --no-shim is used', async () => {
  deploy.request.mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: 'shim-ref' }
    });
  });

  await cmd.handler({ config: '{}', key: 'xxx', shim: false });
  expect(shim.install).not.toHaveBeenCalled();
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('outputs shim install errors', async () => {
  deploy.request.mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: 'shim-ref' }
    });
  });

  shim.install.mockImplementation(async () => {
    throw new Error('error installing package');
  });

  await cmd.handler({ config: '{}', key: 'xxx', shim: true });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays instructions for a missing mailchimp api key', async () => {
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

  await cmd.handler({ config: '{}', key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays instructions for a missing mailchimp audience', async () => {
  deploy.request.mockImplementation(_params => {
    return Promise.resolve({
      status: 422,
      data: {
        id: 'xxxx-xxxx-xxxx',
        errors: [
          {
            code: 'SECRET_REQUIRED',
            field: 'actions[0].audience',
            message: 'is required',
            properties: {
              secret_type: 'mailchimp_audience',
              secret_key: 'my-mailchimp-audience'
            }
          }
        ]
      }
    });
  });

  await cmd.handler({ config: '{}', key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays instructions when a secret reference is required', async () => {
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

  await cmd.handler({ config: '{}', key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('displays general validation errors', async () => {
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

  await cmd.handler({ config: '{}', key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('substitutes all referenced environment variables', async () => {
  deploy.request.mockImplementation(params => {
    expect(params.config.mySecret).toBe('pa$$w0rd');
    expect(params.config.apiKey).toBe('12345');
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: null }
    });
  });

  const config = {
    mySecret: '$MY_SECRET',
    apiKey: '$API_KEY'
  };

  await cmd.handler({ config: JSON.stringify(config), key: 'xxx' });
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('throws an error if undefined env vars are referenced', async () => {
  const config = {
    mySecret: '$MY_SECRET_1',
    apiKey: '$API_KEY_1'
  };

  await cmd.handler({ config: JSON.stringify(config), key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
});

it('throws an error if apiKey properties do not point to env vars', async () => {
  const config = {
    forms: {
      contactForm: {
        actions: [
          {
            apiKey: 'my-inline-key'
          }
        ]
      }
    }
  };

  await cmd.handler({ config: JSON.stringify(config), key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('throws an error if apiSecret properties do not point to env vars', async () => {
  const config = {
    forms: {
      contactForm: {
        actions: [
          {
            apiSecret: 'my-inline-key'
          }
        ]
      }
    }
  };

  await cmd.handler({ config: JSON.stringify(config), key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('throws an error if secretKey properties do not point to env vars', async () => {
  const config = {
    forms: {
      contactForm: {
        actions: [
          {
            secretKey: 'my-inline-key'
          }
        ]
      }
    }
  };

  await cmd.handler({ config: JSON.stringify(config), key: 'xxx' });
  expect(console.error.mock.calls).toMatchSnapshot();
  expect(console.log.mock.calls).toMatchSnapshot();
});

it('skips validating inline secrets with force flag', async () => {
  const config = {
    apiKey: 'my-inline-key'
  };

  deploy.request.mockImplementation(params => {
    expect(params.config.apiKey).toBe('my-inline-key');
    return Promise.resolve({
      status: 200,
      data: { id: 'xxxx-xxxx-xxxx', shim: null }
    });
  });

  await cmd.handler({
    config: JSON.stringify(config),
    key: 'xxx',
    force: true
  });
  expect(console.log.mock.calls).toMatchSnapshot();
});
