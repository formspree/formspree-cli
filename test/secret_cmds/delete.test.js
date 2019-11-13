const axios = require('axios');
const version = require('../../package.json').version;

jest.mock('process', () => ({ env: {} }));
jest.mock('axios');

const cmd = require('../../src/cmds/secrets_cmds/delete');

let consoleSpy;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'log').mockImplementation();
});

afterEach(() => {
  consoleSpy.mockRestore();
});

it('sends request to delete secret', async () => {
  const args = { name: 'my-secret', key: 'xxx' };

  axios.mockImplementation(params => {
    expect(params.method).toBe('delete');
    expect(params.url).toBe(
      'https://api.statickit.com/cli/v1/secrets/my-secret'
    );
    expect(params.headers['StaticKit-Deploy-Key']).toBe('xxx');
    expect(params.headers['User-Agent']).toBe(`@statickit/cli@${version}`);

    return Promise.resolve({ status: 200 });
  });

  await cmd.handler(args);
});
