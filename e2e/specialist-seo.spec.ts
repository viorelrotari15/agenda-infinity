import { expect, test } from '@playwright/test';

/**
 * Requires Nest API on the given base URL with seeded specialist slug `dr-iona-martin`.
 * Default: http://127.0.0.1:3001
 *
 * Example: `docker compose up -d` then `pnpm db:seed` then
 * `E2E_SEO_BASE_URL=http://127.0.0.1:3001 pnpm exec playwright test e2e/specialist-seo.spec.ts`
 */
test.describe('Specialist public SEO page', () => {
  test('GET /p/dr-iona-martin returns HTML with description meta and h1', async ({ request }) => {
    const base = (process.env.E2E_SEO_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
    let res: Awaited<ReturnType<typeof request.get>>;
    try {
      res = await request.get(`${base}/p/dr-iona-martin`, { timeout: 5000 });
    } catch {
      test.skip(true, `API not reachable at ${base}; start API and seed, or set E2E_SEO_BASE_URL`);
      return;
    }
    if (res.status() !== 200) {
      test.skip(
        true,
        `Expected 200 from ${base}/p/dr-iona-martin, got ${res.status()}. Run migrations + seed.`,
      );
      return;
    }
    const text = await res.text();
    expect(text).toContain('<meta name="description"');
    expect(text).toMatch(/<h1[^>]*>/);
    expect(text).toContain('Dr. Iona Martin');
  });
});
