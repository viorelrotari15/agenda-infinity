/**
 * Run a command in the `api` Docker service with the repo mounted at /workspace
 * so Prisma and other backend tools persist outputs on the host.
 *
 * Usage: node scripts/docker-api-run.cjs [-it] <command> [args...]
 *   -it  allocate a TTY (for interactive commands, e.g. prisma migrate dev)
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);

let useIt = false;
if (argv[0] === '-it') {
  useIt = true;
  argv.shift();
}

if (argv.length === 0) {
  console.error('Usage: node scripts/docker-api-run.cjs [-it] <command> [args...]');
  process.exit(1);
}

const dockerArgs = ['compose', 'run', '--rm', '-v', `${root}:/workspace`, '-w', '/workspace'];

if (useIt) {
  dockerArgs.push('-it');
}

dockerArgs.push('api', ...argv);

const r = spawnSync('docker', dockerArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(r.status === 0 ? 0 : (r.status ?? 1));
