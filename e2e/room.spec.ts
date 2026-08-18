import { expect, test } from '@playwright/test';

test('two participants can join and exchange a chat message', async ({ browser, page }) => {
  await page.goto('/');
  await page.locator('#share-button').click();
  await expect(page.locator('#room')).toBeVisible();
  await expect(page).toHaveURL(/\/room\/[a-z2-9]{4}-[a-z2-9]{4}$/);

  const viewerContext = await browser.newContext();
  const viewer = await viewerContext.newPage();
  await viewer.goto(page.url());
  await expect(viewer.locator('#room')).toBeVisible();
  await expect(viewer.locator('[data-chat-input]')).toBeEnabled({ timeout: 20_000 });
  await expect(page.locator('[data-participant-count]').first()).toContainText('2 participants', { timeout: 20_000 });

  await viewer.locator('[data-chat-input]').fill('hello from the browser test');
  await viewer.locator('[data-chat-input]').press('Enter');
  await expect(page.locator('[data-chat-messages]')).toContainText('hello from the browser test', { timeout: 10_000 });
  await expect(page.locator('#notification-toaster')).toContainText('hello from the browser test');
  await viewerContext.close();
});

test('landing page does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#landing')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
