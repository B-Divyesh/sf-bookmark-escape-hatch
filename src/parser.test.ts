import { describe, expect, it } from 'vitest';
import { auditForDestination } from './audit';
import { browserHtml, dryRunReport, neutralArchive, raindropCsv } from './exporters';
import { normalizeUrl, parseBookmarkExport } from './parser';

const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>
<DT><H3 ADD_DATE="1">Research</H3><DL><p>
<DT><A HREF="https://EXAMPLE.com:443/story/#old" ADD_DATE="1704067200" TAGS="read, later">A &amp; B</A>
<DD>A useful note
<DT><A HREF="https://example.com/story">Duplicate</A>
<DT><A HREF="javascript:alert(1)">Unsafe</A>
</DL><p></DL><p>`;

describe('bookmark export parser', () => {
  it('normalizes safe URL details without changing queries', () => {
    expect(normalizeUrl('HTTPS://EXAMPLE.COM:443/a/?b=2&a=1#part')).toBe('https://example.com/a?b=2&a=1');
  });

  it('parses Netscape HTML, folders, notes, duplicate and malformed records', () => {
    const result = parseBookmarkExport(html, 'bookmarks.html');
    expect(result.inputCount).toBe(3);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({ title: 'A & B', folder: 'Research', tags: ['read', 'later'], description: 'A useful note' });
    expect(result.duplicates).toHaveLength(1);
    expect(result.invalid[0].reason).toContain('Unsupported');
  });

  it('flattens nested JSON and preserves vendor-specific fields', () => {
    const result = parseBookmarkExport(JSON.stringify({ bookmarks: [{ name: 'Folder', children: [{ href: 'https://example.net', name: 'Example', dateAdded: 1704067200000, importantFlag: true }] }] }), 'chrome.json');
    expect(result.records[0].folder).toBe('Folder');
    expect(result.records[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.records[0].extras.importantFlag).toBe(true);
  });

  it('parses quoted CSV including commas and line breaks', () => {
    const csv = 'url,title,note,tags\r\n"https://example.org","A, title","line one\nline two","one, two"';
    const result = parseBookmarkExport(csv, 'export.csv');
    expect(result.records[0].title).toBe('A, title');
    expect(result.records[0].description).toContain('line two');
    expect(result.records[0].tags).toEqual(['one', 'two']);
  });

  it('returns actionable errors for empty and malformed input', () => {
    expect(() => parseBookmarkExport('', 'empty.json')).toThrow('empty');
    expect(() => parseBookmarkExport('{ nope', 'broken.json')).toThrow('incomplete or malformed');
    const noUrls = parseBookmarkExport('name,thing\na,b', 'wrong.csv');
    expect(noUrls.records).toHaveLength(0);
    expect(noUrls.invalid[0].reason).toBe('Missing URL');
  });
});

describe('audit and export', () => {
  const parsed = parseBookmarkExport(JSON.stringify([{ url: 'https://example.com', title: 'Example', archivedAt: '2025-01-01', custom: 'kept' }]), 'links.json');

  it('identifies every populated unsupported field for a destination', () => {
    const audit = auditForDestination(parsed, 'browser');
    expect(audit.loss.map((item) => item.field)).toEqual(expect.arrayContaining(['archivedAt', 'source', 'extras']));
    const report = JSON.parse(dryRunReport(audit));
    expect(report.unsupportedFields).toHaveLength(3);
  });

  it('round-trips every valid record through neutral JSON', () => {
    const audit = auditForDestination(parsed, 'neutral');
    const archive = neutralArchive(audit);
    const reparsed = parseBookmarkExport(archive, 'neutral.json');
    expect(reparsed.records).toHaveLength(parsed.records.length);
    expect(reparsed.records[0].url).toBe(parsed.records[0].url);
    expect(JSON.parse(archive).records[0].extras.custom).toBe('kept');
  });

  it('creates valid destination payloads', () => {
    const browser = auditForDestination(parsed, 'browser');
    expect(parseBookmarkExport(browserHtml(browser), 'out.html').records).toHaveLength(1);
    const raindrop = auditForDestination(parsed, 'raindrop');
    expect(parseBookmarkExport(raindropCsv(raindrop), 'out.csv').records).toHaveLength(1);
  });
});
