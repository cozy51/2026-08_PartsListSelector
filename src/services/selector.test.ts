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
  it.each([
    [{S001:'S001-8',S013:'S013-1',S040:'S040-1',S039:'S039-1'},'HH11301B10'],
    [{S001:'S001-1',S013:'S013-3',S040:'S040-1',S039:'S039-2'},'HH11305B10'],
    [{S001:'S001-9',S013:'S013-1',S040:'S040-2',S039:'S039-1'},'HH3130GM10'],
    [{S001:'S001-8',S013:'S013-3',S040:'S040-1',S039:'S039-2'},'HH11314B10'],
    [{S001:'S001-7',S013:'S013-1',S040:'S040-1',S039:'S039-1'},'HH11307B10'],
  ])('DIVERGE UNIT(R)(350X)の条件から%sを一意に選定する', (selection,partNumber) => {
    const result = selectParts(sampleData,selection).find((item) => item.unit.no === '131');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual([partNumber]);
  });
  it.each([
    [{S001:'S001-7',S013:'S013-1',S039:'S039-1'},'HH11301F10'],
    [{S001:'S001-1',S013:'S013-1',S039:'S039-2'},'HH11302F10'],
    [{S001:'S001-10',S013:'S013-3',S039:'S039-1'},'HH11304F10'],
    [{S001:'S001-6',S013:'S013-3',S039:'S039-2'},'HH11305F10'],
    [{S001:'S001-8',S013:'S013-1',S039:'S039-2'},'HH11311F10'],
    [{S001:'S001-9',S013:'S013-3',S039:'S039-2'},'HH11314F10'],
  ])('DIVERGE UNIT(F)(350X)の条件から%sを一意に選定する', (selection,partNumber) => {
    const result = selectParts(sampleData,selection).find((item) => item.unit.no === '130');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual([partNumber]);
  });
  it.each([
    [{S001:'S001-1',S051:'S051-2',S055:'S055-1'},'HH12000010'],
    [{S001:'S001-8',S051:'S051-1',S055:'S055-1'},'HH12000110'],
    [{S001:'S001-10',S051:'S051-3',S055:'S055-1'},'HH12000210'],
    [{S001:'S001-9',S051:'S051-3',S055:'S055-2'},'HH3201SG10'],
    [{S001:'S001-11',S051:'S051-3',S055:'S055-1'},'HH120A0010'],
  ])('HOIST GEAR BOX(350X)の条件から%sを一意に選定する', (selection,partNumber) => {
    const result = selectParts(sampleData,selection).find((item) => item.unit.no === '200');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual([partNumber]);
  });
  it('HOIST GEAR BOX(350X)のNO USEは候補にしない', () => {
    const result = selectParts(sampleData,{S001:'S001-7'}).find((item) => item.unit.no === '200');
    expect(result?.candidates).toHaveLength(0);
  });
  it.each([
    [{S001:'S001-1',S051:'S051-2',S025:'S025-1'},'HH12100010'],
    [{S001:'S001-8',S051:'S051-1',S025:'S025-1'},'HH12100110'],
    [{S001:'S001-10',S051:'S051-3',S025:'S025-1'},'HH12100210'],
    [{S001:'S001-1',S051:'S051-3',S025:'S025-3'},'HH32109R10'],
    [{S001:'S001-9',S051:'S051-3',S025:'S025-2'},'HH32109R10'],
  ])('HOIST BASE UNIT(350X)の条件から%sを一意に選定する', (selection,partNumber) => {
    const result = selectParts(sampleData,selection).find((item) => item.unit.no === '210');
    expect(result?.status).toBe('selected');
    expect(result?.candidates.map((candidate) => candidate.partNumber)).toEqual([partNumber]);
  });
  it('HOIST BASE UNIT(350X)のNO USEは候補にしない', () => {
    const result = selectParts(sampleData,{S001:'S001-7'}).find((item) => item.unit.no === '210');
    expect(result?.candidates).toHaveLength(0);
  });
});
