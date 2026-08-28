import type { AuditResult, BookmarkRecord, DestinationId, DestinationProfile, LossItem, ParseResult } from './types';

export const PROFILES: Record<DestinationId, DestinationProfile> = {
  neutral: { id: 'neutral', label: 'Neutral archive', description: 'Preserves every normalized field and source detail.', supported: ['url', 'title', 'tags', 'createdAt', 'updatedAt', 'archivedAt', 'description', 'folder', 'source', 'extras'], format: 'Portable JSON v1' },
  browser: { id: 'browser', label: 'Browser bookmarks', description: 'Netscape HTML for Chrome, Firefox, Edge, and Safari.', supported: ['url', 'title', 'tags', 'createdAt', 'description', 'folder'], format: 'Netscape Bookmark HTML' },
  raindrop: { id: 'raindrop', label: 'Raindrop.io', description: 'CSV shaped to Raindrop’s documented import columns.', supported: ['url', 'title', 'tags', 'createdAt', 'description', 'folder'], format: 'Raindrop CSV' },
  linkwarden: { id: 'linkwarden', label: 'Linkwarden', description: 'JSON dry run for link and collection metadata.', supported: ['url', 'title', 'tags', 'createdAt', 'updatedAt', 'description', 'folder'], format: 'Linkwarden JSON' },
};

const FIELDS: Array<{ key: keyof BookmarkRecord; label: string; handling: string }> = [
  { key: 'tags', label: 'Tags', handling: 'Retained in the neutral archive only.' },
  { key: 'createdAt', label: 'Created date', handling: 'Retained in the neutral archive only.' },
  { key: 'updatedAt', label: 'Updated date', handling: 'Retained in the neutral archive only.' },
  { key: 'archivedAt', label: 'Archive timestamp', handling: 'Retained in the neutral archive only.' },
  { key: 'description', label: 'Notes / description', handling: 'Retained in the neutral archive only.' },
  { key: 'folder', label: 'Folder / collection', handling: 'Retained in the neutral archive only.' },
  { key: 'source', label: 'Source attribution', handling: 'Retained in the neutral archive provenance block.' },
  { key: 'extras', label: 'Vendor-specific fields', handling: 'Preserved verbatim in each neutral archive record.' },
];

function hasValue(record: BookmarkRecord, key: keyof BookmarkRecord): boolean {
  const value = record[key];
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== '';
}

export function auditForDestination(parsed: ParseResult, destination: DestinationId): AuditResult {
  const profile = PROFILES[destination];
  const loss: LossItem[] = FIELDS.filter(({ key }) => !profile.supported.includes(key)).map(({ key, label, handling }) => {
    const affected = parsed.records.filter((record) => hasValue(record, key));
    return { field: key, label, count: affected.length, examples: affected.slice(0, 3).map((record) => record.title), handling };
  }).filter((item) => item.count > 0);
  return { ...parsed, destination, destinationLabel: profile.label, loss, reportVersion: 1 };
}
