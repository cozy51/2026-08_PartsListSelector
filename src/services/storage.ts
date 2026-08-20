import type { MasterData, Selection } from '../types';
export const DB_NAME = 'parts-list-selector';
// v9: 物件コードをキーに仕様選択を記憶する「projects」ストアを追加。
export const DB_VERSION = 9;
const STORE = 'master';
const PROJECTS_STORE = 'projects';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      else if (event.oldVersion < 8) request.transaction?.objectStore(STORE).delete('data');
      if (!request.result.objectStoreNames.contains(PROJECTS_STORE)) request.result.createObjectStore(PROJECTS_STORE);
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

export type ProjectRecord = { name: string; selection: Selection; updatedAt: string };
export async function loadProject(code: string): Promise<ProjectRecord | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(PROJECTS_STORE).objectStore(PROJECTS_STORE).get(code); request.onsuccess = () => resolve(request.result as ProjectRecord | undefined); request.onerror = () => reject(request.error); });
}
export async function saveProject(code: string, record: ProjectRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(PROJECTS_STORE, 'readwrite'); tx.objectStore(PROJECTS_STORE).put(record, code); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}
export async function listProjects(): Promise<(ProjectRecord & { code: string })[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(PROJECTS_STORE).objectStore(PROJECTS_STORE).openCursor();
    const results: (ProjectRecord & { code: string })[] = [];
    request.onsuccess = () => { const cursor = request.result; if (cursor) { results.push({ code: cursor.key as string, ...(cursor.value as ProjectRecord) }); cursor.continue(); } else resolve(results); };
    request.onerror = () => reject(request.error);
  });
}
