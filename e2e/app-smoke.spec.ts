import { expect, test } from '@playwright/test';

test.describe('Agenda Infinity (built app)', () => {
  test('root redirects to discover tab', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('login page shows primary actions', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('register route loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
  });
});
