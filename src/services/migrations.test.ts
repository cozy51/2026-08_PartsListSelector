import { describe, expect, it } from 'vitest';
import { sampleData } from '../data/sample';
import { ALL_MIGRATION_IDS, migrateMasterData, withAllMigrationsApplied, type Migration } from './migrations';
import type { MasterData } from '../types';

const clone = (data: MasterData): MasterData => JSON.parse(JSON.stringify(data)) as MasterData;

describe('マスターデータの移行処理', () => {
  it('マーカーの無い既存データは、移行処理を再適用せず適用済みとして記録するだけにする', () => {
    // ユーザーがHH13012010のS062条件を編集した状態。従来は起動のたびにS062-2へ巻き戻されていた。
    const saved = clone(sampleData);
    saved.rules = saved.rules.map((rule) => rule.id === '300-HH13012010' ? { ...rule, conditions: { ...rule.conditions, S062: ['S062-4'] } } : rule);
    const { data, notes, changed } = migrateMasterData(saved);
    expect(data.rules.find((rule) => rule.id === '300-HH13012010')?.conditions.S062).toEqual(['S062-4']);
    expect(notes).toEqual([]);
    expect(changed).toBe(true); // 記録の付与だけは保存する
    expect(data.appliedMigrations).toEqual(ALL_MIGRATION_IDS);
  });

  it('ユーザーが削除したユニットのPL条件をサンプルから復活させない', () => {
    const saved = clone(sampleData);
    saved.rules = saved.rules.filter((rule) => rule.unitNo !== '140');
    const { data } = migrateMasterData(saved);
    expect(data.rules.some((rule) => rule.unitNo === '140')).toBe(false);
  });

  it('ユーザーが選定対象へ戻したPLを、再び選定対象外へ戻さない', () => {
    const saved = clone(sampleData);
    saved.rules = saved.rules.map((rule) => rule.id === '710-HH17120010' ? { ...rule, selectable: true } : rule);
    const { data } = migrateMasterData(saved);
    expect(data.rules.find((rule) => rule.id === '710-HH17120010')?.selectable).toBe(true);
  });

  it('記録済みのデータを何度読み込んでも内容が変化しない', () => {
    const saved = clone(sampleData);
    saved.rules = saved.rules.filter((rule) => rule.unitNo !== '140');
    const first = migrateMasterData(saved);
    const second = migrateMasterData(first.data);
    expect(second.changed).toBe(false);
    expect(second.notes).toEqual([]);
    expect(second.data).toEqual(first.data);
    const third = migrateMasterData(second.data);
    expect(third.data).toEqual(first.data);
  });

  it('適用済みの記録はDrive経由で別端末へ渡っても引き継がれる', () => {
    const fromDrive = withAllMigrationsApplied(clone(sampleData));
    fromDrive.rules = fromDrive.rules.filter((rule) => rule.unitNo !== '390');
    const { data, changed } = migrateMasterData(fromDrive);
    expect(changed).toBe(false);
    expect(data.rules.some((rule) => rule.unitNo === '390')).toBe(false);
  });

  it('新規作成したデータには全移行処理を適用済みとして記録する', () => {
    expect(withAllMigrationsApplied(sampleData).appliedMigrations).toEqual(ALL_MIGRATION_IDS);
    expect(migrateMasterData(withAllMigrationsApplied(sampleData)).changed).toBe(false);
  });

  it('移行処理IDは重複しない', () => {
    expect(new Set(ALL_MIGRATION_IDS).size).toBe(ALL_MIGRATION_IDS.length);
  });

  it('今後追加する移行処理（legacyでないもの）は既存データにも1回だけ適用される', () => {
    const future: Migration[] = [{ id: 'future-fix', apply: (data) => ({ data: { ...data, units: data.units.map((unit) => unit.no === '100' ? { ...unit, note: '修正済み' } : unit) }, note: 'ユニット100の備考を修正しました' }) }];
    const first = migrateMasterData(clone(sampleData), future);
    expect(first.notes).toEqual(['ユニット100の備考を修正しました']);
    expect(first.data.units.find((unit) => unit.no === '100')?.note).toBe('修正済み');
    // 2回目は適用済みとして飛ばし、ユーザーがその後編集した内容を巻き戻さない。
    const edited = { ...first.data, units: first.data.units.map((unit) => unit.no === '100' ? { ...unit, note: 'ユーザー編集' } : unit) };
    const second = migrateMasterData(edited, future);
    expect(second.changed).toBe(false);
    expect(second.data.units.find((unit) => unit.no === '100')?.note).toBe('ユーザー編集');
  });
});
