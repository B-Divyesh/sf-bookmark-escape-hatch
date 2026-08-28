import { PROFILES } from './audit';
import type { AuditResult, BookmarkRecord } from './types';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toEpoch(value?: string): string {
  return value ? String(Math.floor(new Date(value).getTime() / 1000)) : '';
}

export function neutralArchive(audit: AuditResult): string {
  return JSON.stringify({
    schema: 'https://bookmark-escape-hatch.sociobot.in/schema/archive-v1.json',
    version: 1,
    createdAt: new Date().toISOString(),
    provenance: { sourceFile: audit.fileName, sourceFormat: audit.format, importedAt: audit.importedAt, generator: 'Bookmark Escape Hatch 1.0' },
    summary: { input: audit.inputCount, portable: audit.records.length, duplicatesExcluded: audit.duplicates.length, invalidExcluded: audit.invalid.length },
    records: audit.records,
  }, null, 2);
}

function grouped(records: BookmarkRecord[]): Map<string, BookmarkRecord[]> {
  const groups = new Map<string, BookmarkRecord[]>();
  records.forEach((record) => {
    const key = record.folder || 'Bookmarks';
    groups.set(key, [...(groups.get(key) ?? []), record]);
  });
  return groups;
}

export function browserHtml(audit: AuditResult): string {
  const sections = [...grouped(audit.records)].map(([folder, records]) => `    <DT><H3>${escapeHtml(folder)}</H3>\n    <DL><p>\n${records.map((record) => `        <DT><A HREF="${escapeHtml(record.url)}"${record.createdAt ? ` ADD_DATE="${toEpoch(record.createdAt)}"` : ''}${record.tags.length ? ` TAGS="${escapeHtml(record.tags.join(','))}"` : ''}>${escapeHtml(record.title)}</A>${record.description ? `\n        <DD>${escapeHtml(record.description)}` : ''}`).join('\n')}\n    </DL><p>`).join('\n');
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${sections}\n</DL><p>\n`;
}

export function raindropCsv(audit: AuditResult): string {
  const header = ['url', 'folder', 'title', 'note', 'tags', 'created'];
  return [header.map(csvCell).join(','), ...audit.records.map((record) => [record.url, record.folder, record.title, record.description, record.tags, record.createdAt].map(csvCell).join(','))].join('\r\n');
}

export function linkwardenJson(audit: AuditResult): string {
  return JSON.stringify(audit.records.map((record) => ({ url: record.url, name: record.title, description: record.description ?? '', tags: record.tags.map((name) => ({ name })), collection: record.folder || 'Unsorted', createdAt: record.createdAt, updatedAt: record.updatedAt })), null, 2);
}

export function dryRunReport(audit: AuditResult): string {
  return JSON.stringify({
    report: 'Bookmark Escape Hatch destination dry run', version: audit.reportVersion, generatedAt: new Date().toISOString(),
    source: { file: audit.fileName, format: audit.format, inputRecords: audit.inputCount },
    destination: { id: audit.destination, label: audit.destinationLabel, format: PROFILES[audit.destination].format },
    outcome: { ready: audit.records.length, duplicatesExcluded: audit.duplicates.length, malformedExcluded: audit.invalid.length, recordsWithFieldLoss: Math.max(0, ...audit.loss.map((item) => item.count)) },
    unsupportedFields: audit.loss,
    invalidRecords: audit.invalid,
    duplicateRecords: audit.duplicates.map(({ record, duplicateOf }) => ({ title: record.title, url: record.url, duplicateOf })),
    note: 'Keep the neutral archive and original export. Test a small import before deleting source data.',
  }, null, 2);
}

export function destinationExport(audit: AuditResult): { content: string; extension: string; mime: string } {
  if (audit.destination === 'browser') return { content: browserHtml(audit), extension: 'html', mime: 'text/html' };
  if (audit.destination === 'raindrop') return { content: raindropCsv(audit), extension: 'csv', mime: 'text/csv' };
  if (audit.destination === 'linkwarden') return { content: linkwardenJson(audit), extension: 'json', mime: 'application/json' };
  return { content: neutralArchive(audit), extension: 'json', mime: 'application/json' };
}
