import { describe, expect, it } from 'vitest';
import { selectParts } from './selector';
import type { MasterData } from '../types';

const base: MasterData = { specifications: [{ no: 1, name: '仕様A', options: ['x', 'y'], order: 1, note: '' }], units: [{ no: '1', name: 'Unit', order: 1, note: '' }], rules: [] };
const rule = (id: string, value: string) => ({ id, unitNo: '1', partNumber: id, name: id, note: '', conditions: { '1': value } });
describe('selectParts', () => {
  it('一致が1件なら選定済み', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, { '1': 'x' })[0].status).toBe('selected'));
  it('一致が0件なら候補なし', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, { '1': 'y' })[0].status).toBe('none'));
  it('一致が複数なら自動確定しない', () => { const result = selectParts({ ...base, rules: [rule('PL1', 'x'), rule('PL2', 'x')] }, { '1': 'x' })[0]; expect(result.status).toBe('multiple'); expect(result.confirmedPartNumber).toBeUndefined(); });
  it('必要な未選択仕様No.を表示する', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, {})[0].missingSpecificationNos).toEqual(['1']));
});
