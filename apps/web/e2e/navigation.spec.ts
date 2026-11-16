import { test, expect } from '@playwright/test';

test('navigate from the home page to the console', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: /Open console/ }).click();

  await expect(page).toHaveURL('/console/');
  await expect(
    page.getByRole('heading', { name: 'Main menu' }),
  ).toBeVisible();
});
