import type { MasterData, ProjectRecord, Selection } from '../types';
export const DB_NAME = 'parts-list-selector';
// v10: projectsストアのキーを物件コードのみから「物件コード::シリアルNO」の複合キーへ変更。
export const DB_VERSION = 10;
const STORE = 'master';
const PROJECTS_STORE = 'projects';
const projectKey = (code: string, serialNo: string) => `${code}::${serialNo}`;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      else if (event.oldVersion < 8) request.transaction?.objectStore(STORE).delete('data');
      if (!request.result.objectStoreNames.contains(PROJECTS_STORE)) request.result.createObjectStore(PROJECTS_STORE);
      else if (event.oldVersion < 10) {
        const store = request.transaction!.objectStore(PROJECTS_STORE);
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const value = cursor.value as ProjectRecord | { name: string; selection: Selection; updatedAt: string };
          if (!('serialNo' in value)) {
            const code = String(cursor.key);
            store.delete(cursor.key);
            const migrated: ProjectRecord = { ...value, code, serialNo: '001' };
            store.put(migrated, projectKey(code, '001'));
          }
          cursor.continue();
        };
      }
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

export type { ProjectRecord } from '../types';
export async function loadProject(code: string, serialNo: string): Promise<ProjectRecord | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(PROJECTS_STORE).objectStore(PROJECTS_STORE).get(projectKey(code, serialNo)); request.onsuccess = () => resolve(request.result as ProjectRecord | undefined); request.onerror = () => reject(request.error); });
}
export async function saveProject(record: ProjectRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(PROJECTS_STORE, 'readwrite'); tx.objectStore(PROJECTS_STORE).put(record, projectKey(record.code, record.serialNo)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}
// 復元時のマージ規則。ローカルにしか無い物件は残し、同じキーは更新日時が新しい方を採用する。
// updated には実際に書き込みが必要な（取り込む側が新しい）レコードだけを入れる。
export function mergeProjectRule(existing: ProjectRecord[], incoming: ProjectRecord[]): { merged: ProjectRecord[]; updated: ProjectRecord[] } {
  const map = new Map(existing.map((record) => [projectKey(record.code, record.serialNo), record]));
  const updated: ProjectRecord[] = [];
  for (const record of incoming) {
    const current = map.get(projectKey(record.code, record.serialNo));
    if (current && current.updatedAt >= record.updatedAt) continue;
    map.set(projectKey(record.code, record.serialNo), record); updated.push(record);
  }
  return { merged: [...map.values()].sort((a, b) => a.code.localeCompare(b.code) || a.serialNo.localeCompare(b.serialNo)), updated };
}

// 復元用の一括保存。ローカルにしか無い物件を消さないようマージしてから書き込む。
export async function mergeProjects(records: ProjectRecord[]): Promise<ProjectRecord[]> {
  const { merged, updated } = mergeProjectRule(await listProjects(), records);
  if (updated.length > 0) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => { const tx = db.transaction(PROJECTS_STORE, 'readwrite'); const store = tx.objectStore(PROJECTS_STORE); for (const record of updated) store.put(record, projectKey(record.code, record.serialNo)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  }
  return merged;
}
export async function deleteProject(code: string, serialNo: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(PROJECTS_STORE, 'readwrite'); tx.objectStore(PROJECTS_STORE).delete(projectKey(code, serialNo)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}
export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(PROJECTS_STORE).objectStore(PROJECTS_STORE).openCursor();
    const results: ProjectRecord[] = [];
    request.onsuccess = () => { const cursor = request.result; if (cursor) { results.push(cursor.value as ProjectRecord); cursor.continue(); } else resolve(results); };
    request.onerror = () => reject(request.error);
  });
}
