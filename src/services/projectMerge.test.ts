import { describe, expect, it } from 'vitest';
import type { ProjectRecord } from '../types';
import { mergeProjectRule } from './storage';

// mergeProjects が使う実物のマージ規則を、IndexedDBに依存せず検証する。
const mergeRule = (existing: ProjectRecord[], incoming: ProjectRecord[]) => mergeProjectRule(existing, incoming).merged;

const project = (code: string, serialNo: string, updatedAt: string, name = code): ProjectRecord => ({ code, serialNo, name, selection: {}, updatedAt });

describe('物件の復元マージ', () => {
  it('このブラウザにしか無い物件を消さない', () => {
    const local = [project('88111', '001', '2026-08-20T10:00:00Z'), project('99999', '001', '2026-08-20T10:00:00Z')];
    const fromDrive = [project('88111', '001', '2026-08-19T10:00:00Z')];
    expect(mergeRule(local, fromDrive).map((record) => record.code)).toEqual(['88111', '99999']);
  });

  it('Driveにしか無い物件を復元する', () => {
    const merged = mergeRule([], [project('88111', '001', '2026-08-20T10:00:00Z'), project('88111', '002', '2026-08-20T10:00:00Z')]);
    expect(merged.map((record) => `${record.code}-${record.serialNo}`)).toEqual(['88111-001', '88111-002']);
  });

  it('同じ物件は更新日時が新しい方を採用する', () => {
    const local = [project('88111', '001', '2026-08-20T12:00:00Z', 'ローカルが新しい')];
    const fromDrive = [project('88111', '001', '2026-08-19T12:00:00Z', 'Driveが古い')];
    expect(mergeRule(local, fromDrive)[0].name).toBe('ローカルが新しい');
    expect(mergeRule(fromDrive, local)[0].name).toBe('ローカルが新しい');
  });

  it('更新日時が同じなら既存を維持する', () => {
    const local = [project('88111', '001', '2026-08-20T12:00:00Z', '既存')];
    const fromDrive = [project('88111', '001', '2026-08-20T12:00:00Z', '取込')];
    expect(mergeRule(local, fromDrive)[0].name).toBe('既存');
  });

  it('シリアルNOが違えば別物件として扱う', () => {
    const merged = mergeRule([project('88111', '001', '2026-08-20T10:00:00Z')], [project('88111', '002', '2026-08-20T10:00:00Z')]);
    expect(merged).toHaveLength(2);
  });

  it('書き込みが必要なレコードだけをupdatedへ入れる', () => {
    const local = [project('88111', '001', '2026-08-20T12:00:00Z')];
    const fromDrive = [project('88111', '001', '2026-08-19T12:00:00Z'), project('77777', '001', '2026-08-20T12:00:00Z')];
    expect(mergeProjectRule(local, fromDrive).updated.map((record) => record.code)).toEqual(['77777']);
  });
});
