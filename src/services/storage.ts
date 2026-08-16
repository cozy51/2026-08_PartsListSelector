import type { MasterData } from '../types';
export const DB_NAME = 'parts-list-selector';
// v5: 66仕様の参照コードと選択判断用の備考を分離して保持。
export const DB_VERSION = 5;
const STORE = 'master';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      else if (event.oldVersion < 5) request.transaction?.objectStore(STORE).delete('data');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadMaster(): Promise<MasterData | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get('data'); request.onsuccess = () => resolve(request.result as MasterData | undefined); request.onerror = () => reject(request.error); });
}
export async function saveMaster(data: MasterData): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(data, 'data'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}
