/**
 * Remaps legacy BookingStatus values (PENDING, CONFIRMED) if present, then db push.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const apiRoot = path.join(__dirname, '..');

spawnSync(
  'pnpm',
  [
    'exec',
    '--',
    'prisma',
    'db',
    'execute',
    '--schema',
    'prisma/schema.prisma',
    '--file',
    'prisma/sql/remap_legacy_booking_status.sql',
  ],
  { cwd: apiRoot, stdio: 'inherit', shell: true },
);

const r = spawnSync(
  'pnpm',
  ['exec', '--', 'prisma', 'db', 'push', '--schema', 'prisma/schema.prisma', '--accept-data-loss'],
  {
  cwd: apiRoot,
  stdio: 'inherit',
  shell: true,
  },
);
process.exit(r.status === 0 ? 0 : (r.status ?? 1));
