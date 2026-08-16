import { describe, expect, it } from 'vitest';
import { selectParts } from './selector';
import type { MasterData } from '../types';

const base: MasterData = { specifications: [{ no: 1, code: 'S001', name: '仕様A', options: [{ code: 'S001-1', label: 'x' }, { code: 'S001-2', label: 'y' }], order: 1, reference: '', note: '' }], units: [{ no: '1', name: 'Unit', order: 1, note: '' }], rules: [] };
const rule = (id: string, value: string) => ({ id, unitNo: '1', partNumber: id, name: id, note: '', selectable: true, conditions: { S001: [value] } });
describe('selectParts', () => {
  it('一致が1件なら選定済み', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, { S001: 'S001-1' })[0].status).toBe('selected'));
  it('一致が0件なら候補なし', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, { S001: 'S001-2' })[0].status).toBe('none'));
  it('一致が複数なら自動確定しない', () => { const result = selectParts({ ...base, rules: [rule('PL1', 'S001-1'), rule('PL2', 'S001-1')] }, { S001: 'S001-1' })[0]; expect(result.status).toBe('multiple'); expect(result.confirmedPartNumber).toBeUndefined(); });
  it('必要な未選択仕様コードを表示する', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, {})[0].missingSpecificationCodes).toEqual(['S001']));
  it('同じPLの複数許容値を1件として判定する', () => { const result=selectParts({ ...base, rules: [{ ...rule('PL1','S001-1'), conditions:{S001:['S001-1','S001-2']} }] }, {S001:'S001-2'})[0]; expect(result.status).toBe('selected'); expect(result.candidates).toHaveLength(1); });
});
