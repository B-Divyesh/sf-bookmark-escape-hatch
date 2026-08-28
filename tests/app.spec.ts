import { createServer, type Server } from 'node:http';
import { open, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { expect, test } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sampleHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p><DT><A HREF="https://example.com/a">A</A></DL><p>`;

async function inspectFile(page: import('playwright/test').Page, name: string, content: string | Buffer): Promise<void> {
  await page.locator('#file-input').setInputFiles({ name, mimeType: name.endsWith('.json') ? 'application/json' : name.endsWith('.csv') ? 'text/csv' : 'text/html', buffer: Buffer.isBuffer(content) ? content : Buffer.from(content) });
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
}

async function downloadText(download: import('playwright/test').Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test('@claim:demo-sandbox opens completed sample data in one click and isolates storage', async ({ page }) => {
  await page.goto('/');
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toBeInViewport();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bookmark-escape-hatch', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('inspections');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('inspections', 'readwrite');
      tx.objectStore('inspections').put({ marker: 'real-data' }, 'sentinel');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await action.click();
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.getByText('Demo — sample data, nothing is saved to your bookmarks')).toBeVisible();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => {
    const names = (await indexedDB.databases()).map((db) => db.name);
    const real = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bookmark-escape-hatch', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const marker = await new Promise<unknown>((resolve, reject) => {
      const request = real.transaction('inspections').objectStore('inspections').get('sentinel');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    real.close();
    return { names, marker, hasDemo: names.includes('demo:bookmark-escape-hatch') };
  });
  expect(stored).toMatchObject({ marker: { marker: 'real-data' }, hasDemo: true });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/#workbench$/);
  await expect(page.getByText('Previous reading found')).toHaveCount(0);
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved to your bookmarks')).toBeVisible();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
});

test('@claim:local-processing keeps the complete demo flow on the product origin', async ({ page }) => {
  const requests: Array<{ url: string; type: string }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), type: request.resourceType() }));
  await page.goto('/demo');
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Records/ }).click();
  await page.getByRole('tab', { name: /Field loss/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Dry-run report/ }).click();
  await download;
  const origin = new URL(page.url()).origin;
  expect(requests.every(({ url }) => new URL(url).origin === origin)).toBe(true);
  expect(requests.some(({ url }) => url.startsWith('https://example.com') || url.startsWith('https://example.org'))).toBe(false);
  expect(requests.some(({ type }) => ['fetch', 'xhr', 'websocket'].includes(type))).toBe(false);
});

test('@claim:offline-reload reloads the completed demo without a network', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Inspect bookmarks/ })).toBeVisible();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
});

test('@claim:input-audit accepts HTML JSON CSV through 50 MB and reports damage', async ({ page }) => {
  await page.goto('/');
  await inspectFile(page, 'bookmarks.html', sampleHtml);
  await inspectFile(page, 'bookmarks.json', JSON.stringify([{ url: 'https://example.net', title: 'JSON record' }]));
  await inspectFile(page, 'bookmarks.csv', 'url,title\r\n"https://example.org","CSV record"');
  const limitPath = test.info().outputPath('limit.json');
  const tooLargePath = test.info().outputPath('too-large.json');
  const limitFile = await open(limitPath, 'w');
  const limitPrefix = Buffer.from(JSON.stringify([{ url: 'https://limit.example', title: 'Limit' }]));
  await limitFile.write(limitPrefix);
  const spaces = Buffer.alloc(1024 * 1024, 0x20);
  let remaining = 50 * 1024 * 1024 - limitPrefix.length;
  while (remaining > 0) {
    const chunk = spaces.subarray(0, Math.min(spaces.length, remaining));
    await limitFile.write(chunk);
    remaining -= chunk.length;
  }
  await limitFile.close();
  const tooLargeFile = await open(tooLargePath, 'w');
  await tooLargeFile.truncate(50 * 1024 * 1024 + 1);
  await tooLargeFile.close();
  await page.locator('#file-input').setInputFiles(limitPath);
  await expect(page.getByText('limit.json', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.locator('#file-input').setInputFiles(tooLargePath);
  await expect(page.locator('.error-state').getByText(/over 50 MB/)).toBeVisible();
  await page.goto('/demo');
  await expect(page.locator('.meters .warning dd')).toContainText('1');
  await expect(page.locator('.meters .danger dd')).toContainText('1');
  await page.getByLabel('Destination profile').selectOption('browser');
  await page.getByRole('button', { name: 'Run inspection' }).click();
  await expect(page.locator('.report-head').getByText('Browser bookmarks', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: /Field loss/ }).click();
  await expect(page.getByText('Source attribution')).toBeVisible();
});

test('@claim:export-files downloads neutral browser Raindrop Linkwarden and dry-run files', async ({ page }) => {
  await page.goto('/demo');
  const destinationLabels: Record<string, string> = { neutral: 'Neutral archive', browser: 'Browser bookmarks', raindrop: 'Raindrop', linkwarden: 'Linkwarden' };
  for (const profile of ['neutral', 'browser', 'raindrop', 'linkwarden']) {
    await page.getByLabel('Destination profile').selectOption(profile);
    await page.getByRole('button', { name: 'Run inspection' }).click();
    await expect(page.locator('.report-head').getByText(destinationLabels[profile], { exact: false })).toBeVisible();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: /Destination file/ }).click();
    const file = await pending;
    expect(file.suggestedFilename()).toContain(`escape-hatch-${profile}`);
    expect((await downloadText(file)).length).toBeGreaterThan(40);
  }
  for (const name of [/Neutral archive/, /Dry-run report/]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name }).click();
    expect(JSON.parse(await downloadText(await pending))).toBeTruthy();
  }
});

test('@claim:local-restore restores and clears only a real completed inspection', async ({ page }) => {
  await page.goto('/');
  await inspectFile(page, 'real-bookmarks.html', sampleHtml);
  await page.reload();
  await expect(page.getByText('Previous reading found')).toBeVisible();
  await page.getByRole('button', { name: 'Restore inspection' }).click();
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear saved inspection' }).click();
  await page.reload();
  await expect(page.getByText('Previous reading found')).toHaveCount(0);
});

test('@claim:free-use presents the full workbench without payment or account controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to use')).toBeVisible();
  await expect(page.getByRole('button', { name: /pay|buy|subscribe|sign in/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /pay|buy|subscribe|sign in/i })).toHaveCount(0);
});

test('meets accessibility, keyboard, first-read, and 390px touch-target regressions', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Inspect bookmarks before you move.' })).toHaveCount(1);
  await expect(page.getByText(/For people with years of bookmarks/)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to archive intake' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await action.focus();
  await action.press('Enter');
  await expect(page.getByText('Inspection complete', { exact: true })).toBeVisible();
  const summary = page.getByRole('tab', { name: 'Summary' });
  await summary.focus();
  await summary.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Records/ })).toBeFocused();
  for (const route of ['/', '/demo', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')), route).toEqual([]);
    if (testInfo.project.name === 'mobile') {
      expect(await page.evaluate(() => document.body.scrollWidth), route).toBeLessThanOrEqual(390);
      const undersized = await page.locator('a:visible, button:visible, select:visible, summary:visible').evaluateAll((items) => items.filter((item) => {
        const box = item.getBoundingClientRect();
        return box.width < 44 || box.height < 44;
      }).map((item) => ({ text: item.textContent?.trim(), box: item.getBoundingClientRect().toJSON() })));
      expect(undersized, route).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test('applies a waiting service-worker update and reloads the open page', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One controlled service-worker update run is sufficient.');
  let version = 1;
  const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp' };
  const server: Server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      let file = pathname === '/' || pathname === '/demo' ? 'index.html' : pathname.slice(1);
      if (file.endsWith('/')) file += 'index.html';
      let path = join(process.cwd(), 'dist', file);
      const missing = !(await stat(path)).isFile();
      if (missing) { file = '404.html'; path = join(process.cwd(), 'dist', file); }
      let body = await readFile(path);
      if (pathname === '/sw.js') body = Buffer.from(`${body.toString('utf8')}\n// controlled-version:${version}\n`);
      response.writeHead(missing ? 404 : 200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': pathname === '/sw.js' ? 'no-store' : 'no-cache' });
      response.end(body);
    } catch { response.writeHead(500).end(); }
  });
  await new Promise<void>((resolve) => server.listen(4199, '127.0.0.1', resolve));
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  try {
    let navigations = 0;
    page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) navigations += 1; });
    await page.goto('http://127.0.0.1:4199/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    version = 2;
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    const update = page.getByRole('button', { name: 'Apply update' });
    await expect(update).toBeVisible();
    const before = navigations;
    await update.click();
    await expect.poll(() => navigations).toBeGreaterThan(before);
    await expect(page.getByRole('button', { name: 'Apply update' })).toBeHidden();
  } finally {
    await context.close();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
