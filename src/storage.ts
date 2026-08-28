import type { AuditResult } from './types';

const DB_NAMES = { real: 'bookmark-escape-hatch', demo: 'demo:bookmark-escape-hatch' } as const;
const STORE = 'inspections';
const KEY = 'latest';
export type StorageNamespace = keyof typeof DB_NAMES;

function database(namespace: StorageNamespace): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAMES[namespace], 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudit(audit: AuditResult, namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await database(namespace);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(audit, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function loadAudit(namespace: StorageNamespace = 'real'): Promise<AuditResult | undefined> {
  const db = await database(namespace);
  const value = await new Promise<AuditResult | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result as AuditResult | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

export async function clearAudit(namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await database(namespace);
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}
