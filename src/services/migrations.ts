import { sampleData } from '../data/sample';
import type { MasterData } from '../types';

export type MigrationResult = { data: MasterData; note: string };
export type Migration = {
  id: string;
  // appliedMigrations マーカー導入前から「起動のたびに」適用され続けていた移行処理。
  // マーカーの無い既存データには適用済みとして記録するだけにして再適用しない。
  // 再適用すると、ユーザーが後から編集・削除した内容を毎回サンプル値へ巻き戻してしまうため。
  legacy?: boolean;
  apply: (data: MasterData) => MigrationResult | undefined;
};

const SEEDED_UNIT_NOS = ['110','120','131','130','200','210','220','230','300','310','320','350','360','370','400','420','421','500','600','700','710','900','140','390','720'];
const nashiOptionCode = (data: MasterData) => data.specifications.find((specification) => specification.code === 'S007')?.options.find((option) => option.label === '無し')?.code;

export const MIGRATIONS: Migration[] = [
  {
    id: 'seed-missing-unit-rules', legacy: true,
    apply: (data) => {
      const missing = SEEDED_UNIT_NOS.filter((unitNo) => !data.rules.some((rule) => rule.unitNo === unitNo));
      if (missing.length === 0) return undefined;
      const added = sampleData.rules.filter((rule) => missing.includes(rule.unitNo));
      return { data: { ...data, rules: [...data.rules, ...added] }, note: `${missing.join('、')}のPL条件${added.length}件を追加しました` };
    },
  },
  {
    id: 's007-add-nashi-option', legacy: true,
    apply: (data) => {
      const s007 = data.specifications.find((specification) => specification.code === 'S007');
      if (!s007 || s007.options.some((option) => option.label === '無し')) return undefined;
      const code = `S007-${s007.options.length + 1}`;
      return { data: { ...data, specifications: data.specifications.map((specification) => specification.code === 'S007' ? { ...specification, options: [...specification.options, { code, label: '無し' }] } : specification) }, note: '搬送物仕様に「無し」を追加しました' };
    },
  },
  {
    id: 'hh3601z210-allow-nashi', legacy: true,
    apply: (data) => {
      const code = nashiOptionCode(data);
      const rule = data.rules.find((item) => item.id === '600-HH3601Z210');
      if (!code || !rule || (rule.conditions.S007 ?? []).includes(code)) return undefined;
      return { data: { ...data, rules: data.rules.map((item) => item.id === '600-HH3601Z210' ? { ...item, conditions: { ...item.conditions, S007: [code] } } : item) }, note: 'HAND(350X)のHH3601Z210を搬送物「無し」で選定できるようにしました' };
    },
  },
  {
    id: 'hh3601ul10-allow-s001-4', legacy: true,
    apply: (data) => {
      const rule = data.rules.find((item) => item.id === '600-HH3601UL10');
      if (!rule || (rule.conditions.S001 ?? []).includes('S001-4')) return undefined;
      return { data: { ...data, rules: data.rules.map((item) => item.id === '600-HH3601UL10' ? { ...item, conditions: { ...item.conditions, S001: [...(item.conditions.S001 ?? []), 'S001-4'] } } : item) }, note: 'HAND(350X)のHH3601UL10をSRC350-M2-4X-Fでも選定できるようにしました' };
    },
  },
  {
    id: 'disable-hh17120010-hh17121010', legacy: true,
    apply: (data) => {
      const targets = ['710-HH17120010','710-HH17121010'];
      if (!data.rules.some((rule) => targets.includes(rule.id) && rule.selectable)) return undefined;
      return { data: { ...data, rules: data.rules.map((rule) => targets.includes(rule.id) ? { ...rule, selectable: false } : rule) }, note: 'HH17120010・HH17121010を選定対象外にしました' };
    },
  },
  {
    id: 'hh13012010-azbil-s062', legacy: true,
    apply: (data) => {
      const rule = data.rules.find((item) => item.id === '300-HH13012010');
      if (!rule || (rule.conditions.S062 ?? []).join(',') === 'S062-2') return undefined;
      return { data: { ...data, rules: data.rules.map((item) => item.id === '300-HH13012010' ? { ...item, conditions: { ...item.conditions, S062: ['S062-2'] } } : item) }, note: 'HH13012010をAzbil（S062-2）で選定できるようにしました' };
    },
  },
];

export const ALL_MIGRATION_IDS = MIGRATIONS.map((migration) => migration.id);

// 新規作成・サンプル復元したデータに「移行処理は適用済み」の印を付ける。
export function withAllMigrationsApplied(data: MasterData): MasterData { return { ...data, appliedMigrations: ALL_MIGRATION_IDS }; }

// 未適用の移行処理だけを1回ずつ適用する。適用済みIDはデータ自身に記録するので、
// 起動のたびに再適用されることも、Drive経由で別端末に渡ったときに再適用されることもない。
export function migrateMasterData(saved: MasterData, migrations: Migration[] = MIGRATIONS): { data: MasterData; notes: string[]; changed: boolean } {
  const firstRun = saved.appliedMigrations === undefined;
  const applied = new Set(saved.appliedMigrations ?? []);
  const notes: string[] = [];
  let current = saved;
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    if (!(firstRun && migration.legacy)) {
      const result = migration.apply(current);
      if (result) { current = result.data; notes.push(result.note); }
    }
    applied.add(migration.id);
  }
  const appliedMigrations = [...applied];
  const changed = notes.length > 0 || appliedMigrations.length !== (saved.appliedMigrations?.length ?? -1);
  return { data: changed ? { ...current, appliedMigrations } : saved, notes, changed };
}
