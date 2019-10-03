const parser = require('../src/parser');

it('returns help output', async () => {
  const output = await new Promise(resolve => {
    parser.parse('--help', (err, argv, output) => {
      resolve(output);
    });
  });

  expect(output).toMatch(/Performs a deployment/);
});
