import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // E2E uses a single shared real database (seed/reset), so parallel workers would conflict.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Bring up real backend + DB (seed runs inside the api container CMD).
      command: 'docker compose up postgres redis minio api',
      url: 'http://127.0.0.1:3001/api/specialists',
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command:
        'pnpm --filter @agenda/app run build && pnpm --filter @agenda/app exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
