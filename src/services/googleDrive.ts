import type { AppSyncData, MasterData } from '../types';

const GIS_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
export const DRIVE_FILE_NAME = 'PartsListSelector-master.json';
export const DRIVE_PARENT_FOLDER = 'WebAppsData';
export const DRIVE_PARENT_FOLDER_ID = '1SWmOnYn98EN5nZs7Jsi3vBLkuJa4B_O6';
export const DRIVE_APP_FOLDER = 'PartsListSelector';
export const GOOGLE_CLIENT_ID_KEY = 'parts-list-selector-google-client-id';
const FOLDER_ID_CACHE_KEY = 'parts-list-selector-drive-folder-id';
const GRANTED_KEY = 'parts-list-selector-google-drive-granted';

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
type GoogleIdentity = { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback: () => void }) => TokenClient } } };
type DriveFile = { id: string; name: string; modifiedTime?: string };
type DriveList = { files?: DriveFile[] };
type DriveFolder = { id: string; name: string; parents?: string[]; trashed?: boolean; createdTime?: string; modifiedTime?: string };
type DriveFolderList = { files?: DriveFolder[] };
export type DriveMasterBackup = { data: AppSyncData; modifiedTime?: string };

declare global { interface Window { google?: GoogleIdentity } }

let scriptPromise: Promise<void> | undefined;
let accessToken = '';

function loadIdentityServices(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_URL; script.async = true; script.defer = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error('Google認証サービスを読み込めませんでした。'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function hasGoogleDriveGrant(): boolean { return localStorage.getItem(GRANTED_KEY) === '1'; }

export async function authorizeGoogleDrive(clientId: string): Promise<void> {
  if (!clientId.trim()) throw new Error('Google OAuthクライアントIDを入力してください。');
  await loadIdentityServices();
  const oauth2 = window.google?.accounts.oauth2;
  if (!oauth2) throw new Error('Google認証サービスを初期化できませんでした。');
  // 既にトークンを保持している、または過去に同意済みなら、毎回の同意画面は出さずに再利用・サイレント再取得する。
  const skipConsentPrompt = Boolean(accessToken) || hasGoogleDriveGrant();
  await new Promise<void>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(), scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => { if (response.access_token) { accessToken = response.access_token; localStorage.setItem(GRANTED_KEY, '1'); resolve(); } else reject(new Error(response.error_description ?? response.error ?? 'Google認証に失敗しました。')); },
      error_callback: () => reject(new Error('Google認証がキャンセルされました。')),
    });
    client.requestAccessToken({ prompt: skipConsentPrompt ? '' : 'consent' });
  });
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!accessToken) throw new Error('先にGoogle Driveへ接続してください。');
  const headers = new Headers(init?.headers); headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) { accessToken = ''; throw new Error('Google Driveの認証が切れました。再度「Google Driveに接続」してください。'); }
  if (!response.ok) throw new Error(`Google Drive APIエラー (${response.status})`);
  return response;
}

function duplicateFolderError(folders: DriveFolder[]): Error {
  console.error(`Google Drive: 「${DRIVE_PARENT_FOLDER}」直下に「${DRIVE_APP_FOLDER}」フォルダが複数見つかりました。`, folders.map((folder) => ({ id: folder.id, createdTime: folder.createdTime, modifiedTime: folder.modifiedTime })));
  return new Error(`Google Drive に ${DRIVE_APP_FOLDER} フォルダが複数存在します。\n${DRIVE_PARENT_FOLDER} 内を確認し、使用するフォルダを1つにしてください。`);
}

async function findPartsListSelectorFolders(): Promise<DriveFolder[]> {
  const query = [`name = '${DRIVE_APP_FOLDER}'`, `mimeType = 'application/vnd.google-apps.folder'`, `'${DRIVE_PARENT_FOLDER_ID}' in parents`, `trashed = false`].join(' and ');
  const response = await driveFetch(`${DRIVE_API}?q=${encodeURIComponent(query)}&fields=files(id,name,parents,createdTime,modifiedTime)&pageSize=10`);
  return ((await response.json()) as DriveFolderList).files ?? [];
}

async function createPartsListSelectorFolder(): Promise<DriveFolder> {
  const response = await driveFetch(`${DRIVE_API}?fields=id,name,parents,createdTime,modifiedTime`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: DRIVE_APP_FOLDER, mimeType: 'application/vnd.google-apps.folder', parents: [DRIVE_PARENT_FOLDER_ID] }) });
  return (await response.json()) as DriveFolder;
}

async function verifyCachedFolderId(id: string): Promise<DriveFolder | undefined> {
  try {
    const response = await driveFetch(`${DRIVE_API}/${id}?fields=id,name,parents,trashed`);
    const file = (await response.json()) as DriveFolder;
    if (file.trashed || !file.parents?.includes(DRIVE_PARENT_FOLDER_ID)) return undefined;
    return file;
  } catch {
    return undefined;
  }
}

async function resolveFolderId(create: boolean): Promise<string | undefined> {
  const cached = localStorage.getItem(FOLDER_ID_CACHE_KEY);
  if (cached) {
    const verified = await verifyCachedFolderId(cached);
    if (verified) return verified.id;
    localStorage.removeItem(FOLDER_ID_CACHE_KEY);
  }
  const existing = await findPartsListSelectorFolders();
  if (existing.length > 1) throw duplicateFolderError(existing);
  if (existing.length === 1) { localStorage.setItem(FOLDER_ID_CACHE_KEY, existing[0].id); return existing[0].id; }
  if (!create) return undefined;
  await createPartsListSelectorFolder();
  const afterCreate = await findPartsListSelectorFolders();
  if (afterCreate.length > 1) throw duplicateFolderError(afterCreate);
  const folder = afterCreate[0];
  if (!folder) throw new Error('Google Driveの保存先フォルダを作成できませんでした。');
  localStorage.setItem(FOLDER_ID_CACHE_KEY, folder.id);
  return folder.id;
}

export async function getOrCreatePartsListSelectorFolder(): Promise<string> {
  const folderId = await resolveFolderId(true);
  if (!folderId) throw new Error('Google Driveの保存先フォルダを作成できませんでした。');
  return folderId;
}

async function findMasterFile(folderId: string): Promise<DriveFile | undefined> {
  const query = [`name = '${DRIVE_FILE_NAME}'`, `'${folderId}' in parents`, `trashed = false`].join(' and ');
  const response = await driveFetch(`${DRIVE_API}?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`);
  return ((await response.json()) as DriveList).files?.[0];
}

export class DriveConflictError extends Error {}

// Drive上のファイルの現在の更新日時だけを取得する（本文はダウンロードしない）。
export async function getGoogleDriveBackupModifiedTime(): Promise<string | undefined> {
  const folderId = await resolveFolderId(false);
  const file = folderId ? await findMasterFile(folderId) : undefined;
  return file?.modifiedTime;
}

// guard を渡すと、Drive側が想定した更新日時から変わっていた場合に上書きせず中止する。
// 別端末やこのアプリの別タブが保存した新しいデータを、古いデータで潰さないための保護。
export async function saveMasterToGoogleDrive(data: AppSyncData, guard?: { expectedModifiedTime?: string }): Promise<string> {
  const folderId = await getOrCreatePartsListSelectorFolder();
  const existing = await findMasterFile(folderId);
  if (guard && existing && existing.modifiedTime !== guard.expectedModifiedTime) {
    throw new DriveConflictError(`Google Drive側のデータが、このブラウザが把握している状態より新しく更新されています（Drive最終更新: ${existing.modifiedTime ? new Date(existing.modifiedTime).toLocaleString('ja-JP') : '不明'}）。\n古い内容で上書きしないよう保存を中止しました。「読み込む」でDriveの内容を取り込んでから、あらためて保存してください。`);
  }
  const metadata = existing ? {} : { name: DRIVE_FILE_NAME, mimeType: 'application/json', parents: [folderId] };
  const form = new FormData(); form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' })); form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const url = existing ? `${UPLOAD_API}/${existing.id}?uploadType=multipart&fields=id,name,modifiedTime` : `${UPLOAD_API}?uploadType=multipart&fields=id,name,modifiedTime`;
  const response = await driveFetch(url, { method: existing ? 'PATCH' : 'POST', body: form });
  return ((await response.json()) as DriveFile).modifiedTime ?? new Date().toISOString();
}

async function readMasterFile(file: DriveFile): Promise<DriveMasterBackup> {
  const raw = (await (await driveFetch(`${DRIVE_API}/${file.id}?alt=media`)).json()) as AppSyncData | MasterData;
  const data: AppSyncData = 'masterData' in raw ? raw : { schemaVersion:1, masterData:raw, selection:{}, syncedAt:file.modifiedTime??new Date().toISOString() };
  return { data, modifiedTime: file.modifiedTime };
}

export async function getGoogleDriveBackupInfo(): Promise<DriveMasterBackup | undefined> {
  const folderId = await resolveFolderId(false);
  const file = folderId ? await findMasterFile(folderId) : undefined;
  return file ? readMasterFile(file) : undefined;
}

export async function loadMasterFromGoogleDrive(): Promise<DriveMasterBackup> {
  const backup = await getGoogleDriveBackupInfo();
  if (!backup) throw new Error(`Google Driveの「${DRIVE_PARENT_FOLDER}/${DRIVE_APP_FOLDER}」に「${DRIVE_FILE_NAME}」がありません。`);
  return backup;
}

export function disconnectGoogleDrive(): void { accessToken = ''; localStorage.removeItem(GRANTED_KEY); }
export function isGoogleDriveAuthorized(): boolean { return Boolean(accessToken); }
