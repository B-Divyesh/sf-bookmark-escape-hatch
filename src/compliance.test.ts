import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('release response policy', () => {
  it('registers every product claim with exactly one executable tagged test', () => {
    const claims = JSON.parse(read('.factory/claims.json')) as Array<{ id: string; test: string }>;
    const testSources = `${read('src/parser.test.ts')}\n${read('tests/app.spec.ts')}`;
    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map(({ id }) => id)).size).toBe(claims.length);
    for (const { id, test } of claims) {
      expect(test).toContain(`@claim:${id}`);
      expect(testSources.match(new RegExp(`@claim:${id}`, 'g'))).toHaveLength(1);
    }
  });

  it('defines CSP, immutable assets, MIME types, demo routing, and a real 404 response', () => {
    const config = JSON.parse(read('public/staticwebapp.config.json'));
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.routes).toContainEqual(expect.objectContaining({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }));
    expect(config.routes).toContainEqual(expect.objectContaining({ route: '/demo', rewrite: '/index.html' }));
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
    expect(config.mimeTypes).toMatchObject({ '.avif': 'image/avif', '.webmanifest': 'application/manifest+json' });
  });

  it('ships route metadata and the shared legal and error shell', () => {
    const index = read('index.html');
    expect(index).toContain('rel="canonical"');
    expect(index).toContain('property="og:image"');
    expect(index).toContain('name="twitter:card"');
    expect(index).toContain('rel="apple-touch-icon"');
    for (const route of ['public/privacy/index.html', 'public/terms/index.html', 'public/404.html']) {
      const html = read(route);
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(html).toContain('<main');
      expect(html).toContain('Built by Param Factory');
      expect(html).toContain('Main navigation');
    }
  });

  it('keeps updates waiting for consent and exposes the activation message only', () => {
    const worker = read('public/sw.js');
    expect(worker.match(/self\.skipWaiting\(\)/g)).toHaveLength(1);
    expect(worker).toContain("event.data === 'SKIP_WAITING'");
  });
});
