import { spawnSync } from 'node:child_process';
import path from 'node:path';

export default async function globalSetup() {
  const repoRoot = path.resolve(__dirname, '..');
  const script = path.join(repoRoot, 'apps', 'api', 'scripts', 'db-push.cjs');

  const r = spawnSync('node', [script], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    throw new Error(`E2E global setup failed to push schema (exit ${r.status ?? 'unknown'}).`);
  }
}

