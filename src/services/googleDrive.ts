import type { MasterData } from '../types';

const GIS_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
export const DRIVE_FILE_NAME = 'PartsListSelector-master.json';
export const GOOGLE_CLIENT_ID_KEY = 'parts-list-selector-google-client-id';

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
type GoogleIdentity = { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback: () => void }) => TokenClient } } };
type DriveFile = { id: string; name: string; modifiedTime?: string };
type DriveList = { files?: DriveFile[] };

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

export async function authorizeGoogleDrive(clientId: string): Promise<void> {
  if (!clientId.trim()) throw new Error('Google OAuthクライアントIDを入力してください。');
  await loadIdentityServices();
  const oauth2 = window.google?.accounts.oauth2;
  if (!oauth2) throw new Error('Google認証サービスを初期化できませんでした。');
  await new Promise<void>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(), scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => { if (response.access_token) { accessToken = response.access_token; resolve(); } else reject(new Error(response.error_description ?? response.error ?? 'Google認証に失敗しました。')); },
      error_callback: () => reject(new Error('Google認証がキャンセルされました。')),
    });
    client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!accessToken) throw new Error('先にGoogle Driveへ接続してください。');
  const headers = new Headers(init?.headers); headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) accessToken = '';
  if (!response.ok) throw new Error(`Google Drive APIエラー (${response.status})`);
  return response;
}

async function findMasterFile(): Promise<DriveFile | undefined> {
  const query = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false and appProperties has { key='partsListSelector' and value='master' }`);
  const response = await driveFetch(`${DRIVE_API}?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`);
  return ((await response.json()) as DriveList).files?.[0];
}

export async function saveMasterToGoogleDrive(data: MasterData): Promise<string> {
  const existing = await findMasterFile();
  const metadata = existing ? {} : { name: DRIVE_FILE_NAME, mimeType: 'application/json', appProperties: { partsListSelector: 'master' } };
  const form = new FormData(); form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' })); form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const url = existing ? `${UPLOAD_API}/${existing.id}?uploadType=multipart&fields=id,name,modifiedTime` : `${UPLOAD_API}?uploadType=multipart&fields=id,name,modifiedTime`;
  const response = await driveFetch(url, { method: existing ? 'PATCH' : 'POST', body: form });
  return ((await response.json()) as DriveFile).modifiedTime ?? new Date().toISOString();
}

export async function loadMasterFromGoogleDrive(): Promise<MasterData> {
  const file = await findMasterFile();
  if (!file) throw new Error(`Google Driveに「${DRIVE_FILE_NAME}」がありません。`);
  return (await (await driveFetch(`${DRIVE_API}/${file.id}?alt=media`)).json()) as MasterData;
}

export function disconnectGoogleDrive(): void { accessToken = ''; }
export function isGoogleDriveAuthorized(): boolean { return Boolean(accessToken); }
