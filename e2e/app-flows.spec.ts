import { expect, test, type Page } from '@playwright/test';
import { apiLogin, installTokensInStorage } from './helpers/test-auth';
import { resetDb, seedBaseData } from './helpers/test-db';

function appToolbarTitle(page: Page, text: string) {
  return page.locator('.app-title-text').filter({ hasText: text });
}

let seeded: Awaited<ReturnType<typeof seedBaseData>>;

test.beforeEach(async ({ page }) => {
  await resetDb();
  seeded = await seedBaseData();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Stabilize text assertions across machines (i18next language detector caches here).
    localStorage.setItem('agenda-lang', 'en');
  });
});

test.describe('Navigation & shell', () => {
  test('guest can switch between Discover and Settings tabs', async ({ page }) => {
    await page.goto('/tabs/discover');
    await expect(appToolbarTitle(page, 'Discover')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/tabs\/settings/);
    await expect(page.getByRole('heading', { name: 'Your workspace' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('guest Settings shows sign-in CTAs', async ({ page }) => {
    await page.goto('/tabs/settings');
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create client account' })).toBeVisible();
  });
});

test.describe('Discover (guest)', () => {
  test('shows directory intro, categories, and specialist card', async ({ page }) => {
    await page.goto('/tabs/discover');
    await expect(
      page.getByText('Browse specialists by category, compare ratings, and book in a few taps.'),
    ).toBeVisible();
    await expect(page.getByText('Therapy (1)', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dr. One' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  test('smart search shows empty state when nothing matches', async ({ page }) => {
    await page.goto('/tabs/discover');
    const search = page.locator('.discover-searchbar input');
    await search.fill('no-such-specialist-xyz');
    await expect(page.getByText('No specialists match your search.')).toBeVisible();
  });

  test('Sign in navigates to login route', async ({ page }) => {
    await page.goto('/tabs/discover');
    await page.getByRole('main').getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth flows', () => {
  test('login submits and lands on Discover with session', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(seeded.client.email);
    await page.getByLabel('Password', { exact: true }).fill(seeded.client.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/tabs\/discover/);
    await expect(
      page.getByText('Browse specialists by category, compare ratings, and book in a few taps.'),
    ).toBeVisible();
  });

  test('register submits and lands on Discover', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill(`new-${Date.now()}@test.local`);
    await page.getByLabel('Phone').fill('0700000000');
    await page.getByLabel('Password', { exact: true }).fill('password12345');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('login page links to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Signed-in client', () => {
  test('Settings shows email and role', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.client);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/settings');
    await expect(page.getByText(seeded.client.email)).toBeVisible();
    await expect(page.getByText('CLIENT', { exact: true })).toBeVisible();
  });

  test('Agenda shows visits hero and empty state', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.client);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/agenda');
    await expect(page.getByRole('heading', { name: 'Your visits' })).toBeVisible();
    await expect(page.getByText('Clear schedule')).toBeVisible();
  });

  test('non-admin is redirected away from Admin route', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.client);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/admin');
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });
});

test.describe('Signed-in specialist', () => {
  test('My page and Availability tabs show specialist content', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.specialistUser);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/discover');
    await page.waitForResponse((r) => r.url().includes('/api/auth/me') && r.status() === 200);

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Your page' })
      .click();

    await expect(page).toHaveURL(/\/tabs\/specialist\/my-page/);
    await expect(page.locator('.settings-title', { hasText: 'Your public page' })).toBeVisible();
    await expect(page.getByRole('heading', { name: seeded.specialist.displayName }).first()).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Availability' })
      .click();
    await expect(page).toHaveURL(/\/tabs\/specialist\/availability/);
    await expect(page.getByText('Working hours and bookable services.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Working hours' })).toBeVisible();
  });

  test('guest does not see specialist tabs', async ({ page }) => {
    await page.goto('/tabs/discover');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Your page' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Availability' })).toHaveCount(0);
  });

  test('Book tab loads specialist and services', async ({ page }) => {
    await page.goto('/tabs/book');
    await expect(appToolbarTitle(page, 'Book')).toBeVisible();
    await expect(page.getByText('Dr. One')).toBeVisible();
  });

  test('specialist view lists upcoming open times soonest-first', async ({ page }) => {
    await page.goto('/tabs/book');
    const region = page.getByRole('region', { name: 'Upcoming bookable times' });
    await expect(region).toBeVisible();
    const rows = page.locator('[data-testid="available-period-row"]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
    const first = await rows.nth(0).getAttribute('data-start');
    const second = await rows.nth(1).getAttribute('data-start');
    expect(first && second).toBeTruthy();
    expect(new Date(first!).getTime()).toBeLessThan(new Date(second!).getTime());
  });

  test('Book this time switches to calendar with slot', async ({ page }) => {
    await page.goto('/tabs/book');
    await page.getByRole('region', { name: 'Upcoming bookable times' }).waitFor();
    const pick = page.getByRole('button', { name: 'Book this time' }).first();
    await pick.click();
    await expect(page.getByRole('heading', { name: 'Choose Service' })).toBeVisible();
  });

  test('Agenda shows schedule for specialist', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.specialistUser);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/agenda');
    await expect(page.getByRole('heading', { name: 'Your schedule' })).toBeVisible();
    await expect(page.getByText('Clear schedule')).toBeVisible();
  });
});

test.describe('Admin', () => {
  test('Admin tab shows control center when role is ADMIN', async ({ page, request }) => {
    const tokens = await apiLogin(request, seeded.admin);
    await installTokensInStorage(page, tokens);
    await page.goto('/tabs/admin');
    await expect(page.getByRole('heading', { name: 'Control center' })).toBeVisible();
    await expect(page.getByText('Users', { exact: true }).first()).toBeVisible();
  });
});

test.describe('Book-only deep link', () => {
  test('bookOnly shows back to Discover and calendar shell', async ({ page }) => {
    await page.goto('/tabs/book?bookOnly=1&specialistSlug=doc-one');
    await expect(appToolbarTitle(page, 'Book')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Discover' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose Service' })).toBeVisible();
  });

  test('bookOnly flow shows slim tab bar (Discover + Settings only)', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/tabs/book?bookOnly=1');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Your page' })).toHaveCount(0);
  });
});
