import { expect, test } from '@playwright/test';
import { apiLogin, installTokensInStorage } from './helpers/test-auth';
import { resetDb, seedBaseData } from './helpers/test-db';

test.describe('Specialist media UI', () => {
  test('my page shows profile photo and gallery when user is specialist', async ({ page, request }) => {
    await resetDb();
    const seeded = await seedBaseData();
    await page.addInitScript(() => {
      localStorage.setItem('agenda-lang', 'en');
    });

    const tokens = await apiLogin(request, seeded.specialistUser);
    await installTokensInStorage(page, tokens);

    await page.goto('/tabs/discover');
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Your page' })
      .click();
    await expect(page).toHaveURL(/\/tabs\/specialist\/my-page/);
    await expect(page.locator('.settings-title', { hasText: 'Your public page' })).toBeVisible();
    await expect(page.getByText('Profile photo', { exact: true })).toBeVisible();
    await expect(page.getByText('Gallery', { exact: true })).toBeVisible();
  });
});
