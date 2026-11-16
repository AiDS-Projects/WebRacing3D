import { test, expect } from '@playwright/test';

test('canvas is rendered inside #app', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#app canvas');
  await expect(canvas).toBeVisible();
});
