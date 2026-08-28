import type { BookmarkRecord, DuplicateRecord, InvalidRecord, ParseResult, SourceFormat } from './types';

type RawBookmark = Record<string, unknown>;

const URL_KEYS = ['url', 'link', 'href', 'uri'];
const TITLE_KEYS = ['title', 'name', 'label'];
const CREATED_KEYS = ['createdAt', 'created_at', 'dateAdded', 'date_added', 'add_date', 'created'];
const UPDATED_KEYS = ['updatedAt', 'updated_at', 'dateModified', 'date_modified', 'modified'];
const ARCHIVED_KEYS = ['archivedAt', 'archived_at', 'archiveTimestamp', 'archive_timestamp'];
const DESCRIPTION_KEYS = ['description', 'note', 'notes', 'excerpt'];
const FOLDER_KEYS = ['folder', 'collection', 'category', 'path'];

function pick(raw: RawBookmark, keys: string[]): unknown {
  for (const key of keys) if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  const entries = Object.entries(raw);
  for (const key of keys) {
    const match = entries.find(([candidate]) => candidate.toLowerCase() === key.toLowerCase());
    if (match && match[1] !== null) return match[1];
  }
  return undefined;
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function parseTags(value: unknown): string[] {
  const values = Array.isArray(value) ? value : text(value).split(/[;,]/);
  return [...new Set(values.map((item) => typeof item === 'object' && item !== null ? text((item as RawBookmark).name) : text(item)).filter(Boolean))];
}

function parseDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = typeof value === 'number' || /^\d+$/.test(text(value)) ? Number(value) : value;
  let date: Date;
  if (typeof raw === 'number') {
    let milliseconds = raw > 10_000_000_000_000 ? raw / 1000 : raw > 10_000_000_000 ? raw : raw * 1000;
    if (milliseconds > 8_000_000_000_000) milliseconds -= 11_644_473_600_000;
    date = new Date(milliseconds);
  } else date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function folderText(value: unknown): string {
  if (value && typeof value === 'object') return text((value as RawBookmark).name ?? (value as RawBookmark).title);
  return text(value);
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/<[^>]+>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? `&${entity};`;
    const hex = entity[1].toLowerCase() === 'x';
    const point = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(point) ? String.fromCodePoint(point) : '';
  }).trim();
}

function parseAttributes(value: string): RawBookmark {
  const attributes: RawBookmark = {};
  const matcher = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of value.matchAll(matcher)) attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  return attributes;
}

function parseHtml(content: string): RawBookmark[] {
  const rows: RawBookmark[] = [];
  const folders: Array<string | null> = [];
  let pendingFolder: string | null = null;
  let lastRow: RawBookmark | undefined;
  const tokens = /<\/?DL\b[^>]*>|<H3\b[^>]*>([\s\S]*?)<\/H3>|<A\b([^>]*)>([\s\S]*?)<\/A>|<DD\b[^>]*>([^<\r\n]*)/gi;

  for (const match of content.matchAll(tokens)) {
    const token = match[0];
    if (/^<H3/i.test(token)) pendingFolder = decodeHtml(match[1] ?? '');
    else if (/^<DL/i.test(token)) {
      folders.push(pendingFolder);
      pendingFolder = null;
    } else if (/^<\/DL/i.test(token)) folders.pop();
    else if (/^<A/i.test(token)) {
      const attrs = parseAttributes(match[2] ?? '');
      lastRow = {
        ...attrs,
        url: attrs.href,
        title: decodeHtml(match[3] ?? ''),
        folder: folders.filter(Boolean).join(' / '),
        tags: attrs.tags,
      };
      rows.push(lastRow);
    } else if (/^<DD/i.test(token) && lastRow) lastRow.description = decodeHtml(match[4] ?? '');
  }
  return rows;
}

function flattenJson(value: unknown, folder = '', rows: RawBookmark[] = []): RawBookmark[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => flattenJson(entry, folder, rows));
    return rows;
  }
  if (!value || typeof value !== 'object') return rows;
  const raw = value as RawBookmark;
  const url = pick(raw, URL_KEYS);
  const ownFolder = folderText(pick(raw, FOLDER_KEYS));
  const nextFolder = ownFolder || (!url && Array.isArray(raw.children) ? text(pick(raw, TITLE_KEYS)) : '');
  const path = [folder, nextFolder].filter(Boolean).join(' / ');
  if (url) rows.push({ ...raw, folder: ownFolder || folder });
  const childKeys = ['children', 'bookmarks', 'links', 'items', 'data', 'results', 'records'];
  let traversed = false;
  for (const key of childKeys) if (Array.isArray(raw[key])) {
    traversed = true;
    flattenJson(raw[key], path, rows);
  }
  if (!url && !traversed) Object.values(raw).forEach((entry) => {
    if (Array.isArray(entry)) flattenJson(entry, path, rows);
  });
  return rows;
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === '"' && quoted && content[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field); if (row.some((cell) => cell.trim())) rows.push(row); row = []; field = '';
    } else field += char;
  }
  row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function parseCsv(content: string): RawBookmark[] {
  const rows = parseCsvRows(content);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ''));
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function detectFormat(fileName: string, content: string): SourceFormat {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'html' || extension === 'htm') return 'html';
  if (extension === 'json') return 'json';
  if (extension === 'csv') return 'csv';
  const sample = content.trimStart();
  if (sample.startsWith('{') || sample.startsWith('[')) return 'json';
  if (/<a\b[^>]*href=/i.test(sample)) return 'html';
  if (sample.split(/\r?\n/, 1)[0].includes(',')) return 'csv';
  throw new Error('Format not recognized. Choose an HTML, JSON, or CSV bookmark export.');
}

export function normalizeUrl(value: unknown): string {
  const raw = text(value);
  if (!raw) throw new Error('Missing URL');
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('URL is not valid'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported ${url.protocol || 'URL'} scheme`);
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return `bmk_${(result >>> 0).toString(36)}`;
}

const KNOWN_KEYS = new Set([...URL_KEYS, ...TITLE_KEYS, ...CREATED_KEYS, ...UPDATED_KEYS, ...ARCHIVED_KEYS, ...DESCRIPTION_KEYS, ...FOLDER_KEYS, 'tags', 'tag', 'children', 'type', 'id']);

function normalize(raw: RawBookmark, index: number, fileName: string, format: SourceFormat): BookmarkRecord {
  const url = normalizeUrl(pick(raw, URL_KEYS));
  const title = text(pick(raw, TITLE_KEYS)) || new URL(url).hostname;
  const extras = Object.fromEntries(Object.entries(raw).filter(([key, value]) => !KNOWN_KEYS.has(key) && value !== '' && value !== null && value !== undefined));
  const unparsedDates = [...CREATED_KEYS, ...UPDATED_KEYS, ...ARCHIVED_KEYS].filter((key) => raw[key] !== undefined && !parseDate(raw[key]));
  if (unparsedDates.length) extras.unparsedDateFields = Object.fromEntries(unparsedDates.map((key) => [key, raw[key]]));
  return {
    id: hash(`${url}|${index}|${fileName}`), url, title,
    tags: parseTags(raw.tags ?? raw.tag),
    createdAt: parseDate(pick(raw, CREATED_KEYS)),
    updatedAt: parseDate(pick(raw, UPDATED_KEYS)),
    archivedAt: parseDate(pick(raw, ARCHIVED_KEYS)),
    description: text(pick(raw, DESCRIPTION_KEYS)) || undefined,
    folder: folderText(pick(raw, FOLDER_KEYS)) || undefined,
    source: { file: fileName, format, index }, extras,
  };
}

function normalizeNeutralRecord(raw: RawBookmark, index: number): BookmarkRecord {
  const url = normalizeUrl(raw.url);
  const source = raw.source;
  const extras = raw.extras;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Neutral record has invalid source attribution');
  if (!extras || typeof extras !== 'object' || Array.isArray(extras)) throw new Error('Neutral record has invalid vendor details');
  const typedSource = source as RawBookmark;
  const sourceFormat = text(typedSource.format);
  if (!['html', 'json', 'csv'].includes(sourceFormat)) throw new Error('Neutral record has an unsupported source format');
  return {
    id: text(raw.id) || hash(`${url}|${index}|neutral`),
    url,
    title: text(raw.title) || new URL(url).hostname,
    tags: parseTags(raw.tags),
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    archivedAt: parseDate(raw.archivedAt),
    description: text(raw.description) || undefined,
    folder: text(raw.folder) || undefined,
    source: {
      file: text(typedSource.file),
      format: sourceFormat as SourceFormat,
      index: Number(typedSource.index),
    },
    extras: structuredClone(extras) as Record<string, unknown>,
  };
}

export function parseBookmarkExport(content: string, fileName = 'pasted-export.txt'): ParseResult {
  if (!content.trim()) throw new Error('The export is empty. Choose a file that contains bookmarks.');
  const format = detectFormat(fileName, content);
  let rawRows: RawBookmark[];
  let isNeutralArchive = false;
  try {
    if (format === 'html') rawRows = parseHtml(content);
    else if (format === 'csv') rawRows = parseCsv(content);
    else {
      const json = JSON.parse(content) as unknown;
      isNeutralArchive = Boolean(json && typeof json === 'object' && !Array.isArray(json)
        && (json as RawBookmark).schema === 'https://bookmark-escape-hatch.sociobot.in/schema/archive-v1.json'
        && (json as RawBookmark).version === 1
        && Array.isArray((json as RawBookmark).records));
      rawRows = isNeutralArchive ? (json as RawBookmark).records as RawBookmark[] : flattenJson(json);
    }
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The JSON export is incomplete or malformed. Export it again and retry.');
    throw error;
  }
  if (!rawRows.length) throw new Error(`No bookmark records were found in this ${format.toUpperCase()} export.`);

  const records: BookmarkRecord[] = [];
  const duplicates: DuplicateRecord[] = [];
  const invalid: InvalidRecord[] = [];
  const seen = new Map<string, string>();
  rawRows.forEach((raw, index) => {
    try {
      const record = isNeutralArchive ? normalizeNeutralRecord(raw, index) : normalize(raw, index, fileName, format);
      const original = seen.get(record.url);
      if (original) duplicates.push({ record, duplicateOf: original });
      else { seen.set(record.url, record.id); records.push(record); }
    } catch (error) {
      invalid.push({ index, title: text(pick(raw, TITLE_KEYS)) || `Record ${index + 1}`, rawUrl: text(pick(raw, URL_KEYS)), reason: error instanceof Error ? error.message : 'Malformed record' });
    }
  });
  return { fileName, format, importedAt: new Date().toISOString(), inputCount: rawRows.length, records, duplicates, invalid };
}
