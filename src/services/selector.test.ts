import { describe, expect, it } from 'vitest';
import { selectParts } from './selector';
import type { MasterData } from '../types';
import { sampleData } from '../data/sample';

const base: MasterData = { specifications: [{ no: 1, code: 'S001', name: '仕様A', options: [{ code: 'S001-1', label: 'x' }, { code: 'S001-2', label: 'y' }], order: 1, reference: '', note: '' }], units: [{ no: '1', name: 'Unit', order: 1, note: '' }], rules: [] };
const rule = (id: string, value: string) => ({ id, unitNo: '1', partNumber: id, note: '', selectable: true, conditions: { S001: [value] } });
describe('selectParts', () => {
  it('一致が1件なら選定済み', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, { S001: 'S001-1' })[0].status).toBe('selected'));
  it('一致が0件なら候補なし', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, { S001: 'S001-2' })[0].status).toBe('none'));
  it('一致が複数なら自動確定しない', () => { const result = selectParts({ ...base, rules: [rule('PL1', 'S001-1'), rule('PL2', 'S001-1')] }, { S001: 'S001-1' })[0]; expect(result.status).toBe('multiple'); expect(result.confirmedPartNumber).toBeUndefined(); });
  it('必要な未選択仕様コードを表示する', () => expect(selectParts({ ...base, rules: [rule('PL1', 'S001-1')] }, {})[0].missingSpecificationCodes).toEqual(['S001']));
  it('同じPLの複数許容値を1件として判定する', () => { const result=selectParts({ ...base, rules: [{ ...rule('PL1','S001-1'), conditions:{S001:['S001-1','S001-2']} }] }, {S001:'S001-2'})[0]; expect(result.status).toBe('selected'); expect(result.candidates).toHaveLength(1); });
  it('STEERING UNIT(F)の標準CW仕様を一意に選定する', () => {
    const selection = { S001:'S001-8', S012:'S012-1', S013:'S013-1', S003:'S003-1', S054:'S054-1', S014:'S014-1', S059:'S059-1' };
    const result = selectParts(sampleData,selection).find((item) => item.unit.no === '110');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual(['HH11101F10']);
  });
  it.each([
    ['S001-7','HH11200010'],['S001-8','HH11200010'],['S001-1','HH11201010'],['S001-6','HH11201010'],['S001-13','HH112A0010'],
  ])('CORE UNIT (350X)で型式%sから%sを一意に選定する', (model,partNumber) => {
    const result = selectParts(sampleData,{S001:model}).find((item) => item.unit.no === '120');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual([partNumber]);
  });
});
