require('dotenv').config();

const fs = require('fs');
const execa = require('execa');
const path = require('path');
const { stripIndent } = require('common-tags');

// Execute the `statickit` command from the sandbox directory
const command = async (args, opts) => {
  return await execa(
    '../bin/statickit',
    args,
    Object.assign({ cwd: 'tmp' }, opts)
  );
};

// Resolve path to file in the working directory for the command
const resolveSandbox = file => {
  return path.resolve('tmp', file);
};

beforeEach(async () => {
  // Create a sandbox directory to serve a the command working directory,
  // since tests that interact with the file system conflict with files
  // in the repo.
  fs.mkdirSync('tmp');
});

afterEach(async () => {
  const files = fs.readdirSync('tmp');

  // Delete all the files in the temp directory
  for (const file of files) {
    fs.unlinkSync(resolveSandbox(file));
  }

  fs.rmdirSync('tmp');
});

describe('init', () => {
  it('creates an empty statickit.json file', async () => {
    const path = resolveSandbox('statickit.json');

    expect(() => {
      fs.readFileSync(path, 'utf8');
    }).toThrow(/no such file or directory/);

    const { stdout } = await command(['init']);

    expect(fs.readFileSync(path, 'utf8')).toMatch(/{}/);
    expect(stdout).toMatch(/statickit\.json created/);
  });

  it('does not overwrite existing files', async () => {
    const path = resolveSandbox('statickit.json');
    const contents = '{"forms":{}}';
    fs.writeFileSync(path, contents);

    const { stdout } = await command(['init']);

    expect(fs.readFileSync(path, 'utf8')).toBe(contents);
    expect(stdout).toMatch(/statickit\.json already exists/);
  });
});

describe('forms add', () => {
  it("creates a config file if one doesn't exist", async () => {
    const path = resolveSandbox('statickit.json');
    const result = await command(['forms', 'add', 'contact', 'Contact Form']);
    expect(result.stdout).toMatch(/added/);

    const expected = stripIndent`
      {
        "forms": {
          "contact": {
            "name": "Contact Form"
          }
        }
      }
    `;

    const contents = fs.readFileSync(path, 'utf8');
    expect(contents).toBe(expected);
  });

  it('appends to existing forms', async () => {
    const path = resolveSandbox('statickit.json');
    await command(['forms', 'add', 'contact', 'Contact Form']);
    const result = await command(['forms', 'add', 'newsletter', 'Newsletter']);
    expect(result.stdout).toMatch(/added/);

    const expected = stripIndent`
      {
        "forms": {
          "contact": {
            "name": "Contact Form"
          },
          "newsletter": {
            "name": "Newsletter"
          }
        }
      }
    `;

    const contents = fs.readFileSync(path, 'utf8');
    expect(contents).toBe(expected);
  });

  it('returns an error if key already exists', async () => {
    const path = resolveSandbox('statickit.json');
    await command(['forms', 'add', 'contact', 'Contact Form']);
    const result = await command(['forms', 'add', 'contact', 'Duplicate Form']);
    expect(result.stderr).toMatch(/already exists/);

    const expected = stripIndent`
      {
        "forms": {
          "contact": {
            "name": "Contact Form"
          }
        }
      }
    `;

    const contents = fs.readFileSync(path, 'utf8');
    expect(contents).toBe(expected);
  });
});

// describe('deploy', () => {
//   it('returns an error if no config is present', async () => {
//     try {
//       await command(['deploy']);
//     } catch (result) {
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toMatch(/Configuration not provided/);
//     }
//   });

//   it('accepts a deploy key from .env file', async () => {
//     fs.writeFileSync(
//       resolveSandbox('.env'),
//       `STATICKIT_DEPLOY_KEY=${process.env.STATICKIT_TEST_DEPLOY_KEY}`,
//       'utf8'
//     );

//     const { stdout, exitCode } = await command(['deploy', '-c', '{}']);
//     expect(exitCode).toBe(0);
//     expect(stdout).toMatch(/Deployment succeeded/);
//   });

//   it('accepts a config from the statickit.json file', async () => {
//     fs.writeFileSync(resolveSandbox('statickit.json'), '{}', 'utf8');

//     const { stdout, exitCode } = await command(['deploy'], {
//       env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
//     });
//     expect(exitCode).toBe(0);
//     expect(stdout).toMatch(/Deployment succeeded/);
//   });

//   it('accepts a config from a custom file', async () => {
//     fs.writeFileSync(resolveSandbox('statickit-custom.json'), '{}', 'utf8');

//     const { stdout, exitCode } = await command(
//       ['deploy', '--file', 'statickit-custom.json'],
//       {
//         env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
//       }
//     );
//     expect(exitCode).toBe(0);
//     expect(stdout).toMatch(/Deployment succeeded/);
//   });

//   it('returns an error if config is unparsable', async () => {
//     try {
//       await command(['deploy', '-c', '{']);
//     } catch (result) {
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toMatch(/Configuration could not be parsed/);
//     }
//   });

//   it('returns an error if deploy key is not found', async () => {
//     try {
//       await command(['deploy', '-c', '{}']);
//     } catch (result) {
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toMatch(/Deploy key is required/);
//     }
//   });

//   it('returns an error if deploy key is invalid', async () => {
//     try {
//       await command(['deploy', '-c', '{}', '-k', 'invalidkey']);
//     } catch (result) {
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toMatch(/Deploy key is not valid/);
//     }
//   });

//   it('succeeds given valid params', async () => {
//     const { stdout, exitCode } = await command([
//       'deploy',
//       '-c',
//       '{}',
//       '-k',
//       process.env.STATICKIT_TEST_DEPLOY_KEY
//     ]);
//     expect(exitCode).toBe(0);
//     expect(stdout).toMatch(/Deployment succeeded/);
//   });

//   it('accepts a deploy key from env', async () => {
//     const { stdout, exitCode } = await command(['deploy', '-c', '{}'], {
//       env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
//     });
//     expect(exitCode).toBe(0);
//     expect(stdout).toMatch(/Deployment succeeded/);
//   });

//   it('fails given invalid params', async () => {
//     try {
//       await command([
//         'deploy',
//         '-c',
//         '{"forms":{"a":{"name":""}}}',
//         '-k',
//         process.env.STATICKIT_TEST_DEPLOY_KEY
//       ]);
//     } catch (result) {
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toMatch(/Deployment failed/);
//     }
//   });
// });
