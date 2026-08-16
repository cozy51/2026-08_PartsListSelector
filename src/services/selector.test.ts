import { describe, expect, it } from 'vitest';
import { selectParts } from './selector';
import type { MasterData } from '../types';

const base: MasterData = { specifications: [{ code: 'A', name: '仕様A', options: ['x', 'y'], order: 1, note: '' }], units: [{ no: '1', name: 'Unit', order: 1, note: '' }], rules: [] };
const rule = (id: string, value: string) => ({ id, unitNo: '1', partNumber: id, name: id, note: '', conditions: { A: value } });
describe('selectParts', () => {
  it('一致が1件なら選定済み', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, { A: 'x' })[0].status).toBe('selected'));
  it('一致が0件なら候補なし', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, { A: 'y' })[0].status).toBe('none'));
  it('一致が複数なら自動確定しない', () => { const result = selectParts({ ...base, rules: [rule('PL1', 'x'), rule('PL2', 'x')] }, { A: 'x' })[0]; expect(result.status).toBe('multiple'); expect(result.confirmedPartNumber).toBeUndefined(); });
  it('必要な未選択仕様を表示する', () => expect(selectParts({ ...base, rules: [rule('PL1', 'x')] }, {})[0].missingCodes).toEqual(['A']));
});
