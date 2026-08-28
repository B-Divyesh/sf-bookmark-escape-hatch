export type SourceFormat = 'html' | 'json' | 'csv';
export type DestinationId = 'neutral' | 'browser' | 'raindrop' | 'linkwarden';

export interface BookmarkRecord {
  id: string;
  url: string;
  title: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  description?: string;
  folder?: string;
  source: { file: string; format: SourceFormat; index: number };
  extras: Record<string, unknown>;
}

export interface InvalidRecord {
  index: number;
  title: string;
  rawUrl: string;
  reason: string;
}

export interface DuplicateRecord {
  record: BookmarkRecord;
  duplicateOf: string;
}

export interface ParseResult {
  fileName: string;
  format: SourceFormat;
  importedAt: string;
  inputCount: number;
  records: BookmarkRecord[];
  duplicates: DuplicateRecord[];
  invalid: InvalidRecord[];
}

export interface LossItem {
  field: string;
  label: string;
  count: number;
  examples: string[];
  handling: string;
}

export interface AuditResult extends ParseResult {
  destination: DestinationId;
  destinationLabel: string;
  loss: LossItem[];
  reportVersion: 1;
}

export interface DestinationProfile {
  id: DestinationId;
  label: string;
  description: string;
  supported: Array<keyof BookmarkRecord>;
  format: string;
}
