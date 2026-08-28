import { expect, test } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('completes an inspection and downloads evidence', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByRole('button', { name: 'Load a 3-record sample' }).click();
  await page.getByLabel('Destination profile').selectOption('browser');
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await expect(page.getByText('Ready with repairs')).toBeVisible();
  await expect(page.locator('.meters .good dd')).toContainText('2');
  await expect(page.locator('.meters .warning dd')).toContainText('1');
  await expect(page.locator('.meters .danger dd')).toContainText('1');

  await page.getByRole('tab', { name: /Records/ }).click();
  await expect(page.getByText('Broken record')).toBeVisible();
  await page.getByRole('tab', { name: /Field loss/ }).click();
  await expect(page.getByText('Source attribution')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Dry-run report/ }).click();
  expect((await download).suggestedFilename()).toBe('escape-hatch-browser-dry-run.json');
});

test('has no serious accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Axe runs against the complete desktop state.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Load a 3-record sample' }).click();
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('survives reload and operates offline', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load a 3-record sample' }).click();
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Previous reading found')).toBeVisible();
  await page.getByRole('button', { name: 'Restore inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cached = await page.evaluate(async () => (await caches.open('escape-hatch-v1')).keys().then((keys) => keys.map((request) => request.url)));
  expect(cached.some((url) => url.endsWith('.js'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Know what survives/ })).toBeVisible();
  await expect(page.getByText('Offline mode')).toBeVisible();
});

test('fits a 390px viewport and supports keyboard tabs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only viewport assertion.');
  await page.goto('/');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.getByRole('button', { name: 'Load a 3-record sample' }).click();
  await page.getByRole('button', { name: 'Run inspection' }).click();
  const summary = page.getByRole('tab', { name: 'Summary' });
  await summary.focus();
  await summary.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Records/ })).toBeFocused();
});
