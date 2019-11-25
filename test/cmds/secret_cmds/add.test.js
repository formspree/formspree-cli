const axios = require('axios');
const version = require('../../../package.json').version;

jest.mock('process', () => ({ env: {} }));
jest.mock('axios');

const cmd = require('../../../src/cmds/secrets_cmds/add');

let consoleSpy;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'log').mockImplementation();
});

afterEach(() => {
  consoleSpy.mockRestore();
});

it('sends request to add secret', async () => {
  const args = { name: 'my-secret', value: 'shhh', key: 'xxx' };

  axios.mockImplementation(params => {
    expect(params.method).toBe('post');
    expect(params.url).toBe('https://api.statickit.com/cli/v1/secrets');
    expect(params.data.key).toBe('my-secret');
    expect(params.data.value).toBe('shhh');
    expect(params.headers['StaticKit-Deploy-Key']).toBe('xxx');
    expect(params.headers['User-Agent']).toBe(`@statickit/cli@${version}`);

    return Promise.resolve({ status: 200 });
  });

  await cmd.handler(args);
});
