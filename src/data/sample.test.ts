import { describe, expect, it } from 'vitest';
import { sampleData } from './sample';

describe('sample master data', () => {
  it('仕様No.1～66を重複なく保持する', () => {
    expect(sampleData.specifications.map((specification) => specification.no)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
    expect(sampleData.specifications.map((specification) => specification.code)).toEqual(Array.from({ length: 66 }, (_, index) => `S${String(index + 1).padStart(3, '0')}`));
    for (const specification of sampleData.specifications) {
      expect(specification.options.map((option) => option.code)).toEqual(specification.options.map((_, index) => `${specification.code}-${index + 1}`));
    }
  });

  it('従来のコロン前コードを選択肢表示名に含めない', () => {
    expect(sampleData.specifications.find((specification) => specification.code === 'S002')?.options[0]).toEqual({ code: 'S002-1', label: '必要' });
    expect(sampleData.specifications.find((specification) => specification.code === 'S003')?.options[0]).toEqual({ code: 'S003-1', label: 'CW' });
  });

  it('各仕様の参照コードと選択用備考を分離して保持する', () => {
    const cleaningVehicle = sampleData.specifications.find((specification) => specification.code === 'S002');
    expect(cleaningVehicle?.reference).toBe('MW01');
    expect(cleaningVehicle?.note).toContain('クリーニングビークル以外');
    expect(sampleData.specifications.every((specification) => typeof specification.note === 'string')).toBe(true);
    expect(sampleData.specifications.find((specification) => specification.code === 'S008')?.note).toContain('\nその他の搬送物');
    expect(sampleData.specifications.find((specification) => specification.code === 'S054')?.note).toBe('基本的には「無し」（？？？');
  });

  it('提示されたユニットを指定順で保持する', () => {
    expect(sampleData.units.map((unit) => unit.no)).toEqual([
      '100', '111', '110', '120', '131', '130', '200', '210', '220', '230', '300', '310', '320', '350',
      '360', '370', '400', '420', '421', '500', '600', '700', '710', '900', '140', '390', '720',
    ]);
  });

  it('PL品番はユニット内でユニークに保持する', () => {
    const keys = sampleData.rules.map((rule) => `${rule.unitNo}:${rule.partNumber}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(sampleData.rules.find((rule) => rule.partNumber === 'HH11101B10')?.conditions.S001).toEqual(['S001-8', 'S001-9', 'S001-10']);
    expect(sampleData.rules.some((rule) => 'name' in rule)).toBe(false);
    expect(sampleData.rules.find((rule) => rule.partNumber === 'HH11101B10')?.note).toBe('ダイカスト化');
  });

  it('STEERING UNIT(F)の41行を13件のユニークPLに統合する', () => {
    const frontSteeringRules = sampleData.rules.filter((rule) => rule.unitNo === '110');
    expect(frontSteeringRules).toHaveLength(13);
    expect(frontSteeringRules.map((rule) => rule.partNumber)).toEqual([
      'HH11101F10','HH311FDZ10','HH11102F10','HH311FH810','HH11103F10','HH11104F10','HH311FCJ10',
      'HH311FD110','HH3114AP10','HH311FDN10','HH111A1F10','HH3131TK10','HH3119LH10',
    ]);
    expect(frontSteeringRules.find((rule) => rule.partNumber === 'HH11101F10')?.conditions).toMatchObject({ S003:['S003-1'], S014:['S014-1'], S054:['S054-1'], S059:['S059-1'] });
    expect(frontSteeringRules.find((rule) => rule.partNumber === 'HH3114AP10')?.conditions.S003).toEqual(['S003-2']);
    expect(frontSteeringRules.find((rule) => rule.partNumber === 'HH311FD110')?.conditions.S054).toEqual(['S054-2']);
    expect(frontSteeringRules.find((rule) => rule.partNumber === 'HH311FDN10')?.conditions.S059).toEqual(['S059-2']);
  });

  it('CORE UNIT (350X)の11行を型式別の3件のユニークPLに統合する', () => {
    const coreRules = sampleData.rules.filter((rule) => rule.unitNo === '120');
    expect(coreRules.map((rule) => rule.partNumber)).toEqual(['HH11200010','HH11201010','HH112A0010']);
    expect(coreRules.find((rule) => rule.partNumber === 'HH11200010')?.conditions.S001).toEqual(['S001-7','S001-8','S001-9','S001-10']);
    expect(coreRules.find((rule) => rule.partNumber === 'HH11201010')?.conditions.S001).toEqual(['S001-1','S001-2','S001-3','S001-4','S001-5','S001-6']);
    expect(coreRules.find((rule) => rule.partNumber === 'HH112A0010')?.conditions.S001).toEqual(['S001-13']);
  });

  it('DIVERGE UNIT(R)(350X)の29行を9件のユニークPLに統合する', () => {
    const divergeRules = sampleData.rules.filter((rule) => rule.unitNo === '131');
    expect(divergeRules.map((rule) => rule.partNumber)).toEqual(['HH11301B10','HH11302B10','HH11304B10','HH11305B10','HH3130GM10','HH11311B10','HH11314B10','HH11306B10','HH11307B10']);
    expect(divergeRules.find((rule) => rule.partNumber === 'HH3130GM10')?.conditions).toMatchObject({ S013:['S013-1'],S040:['S040-2'],S039:['S039-1'] });
    expect(divergeRules.find((rule) => rule.partNumber === 'HH11314B10')?.conditions).toMatchObject({ S013:['S013-3'],S040:['S040-1'],S039:['S039-2'] });
    expect(divergeRules.find((rule) => rule.partNumber === 'HH11306B10')?.conditions.S001).toEqual(['S001-7']);
  });

  it('DIVERGE UNIT(F)(350X)の30行を8件のユニークPLに統合する', () => {
    const divergeRules = sampleData.rules.filter((rule) => rule.unitNo === '130');
    expect(divergeRules.map((rule) => rule.partNumber)).toEqual(['HH11301F10','HH11302F10','HH11304F10','HH11305F10','HH11311F10','HH11314F10','HH3131K810','HH3130NP10']);
    expect(divergeRules.find((rule) => rule.partNumber === 'HH11301F10')?.conditions.S001).toEqual(['S001-7','S001-8','S001-9','S001-10']);
    expect(divergeRules.find((rule) => rule.partNumber === 'HH11314F10')?.conditions).toMatchObject({S013:['S013-3'],S039:['S039-2']});
    expect(divergeRules.filter((rule) => !rule.selectable).map((rule) => rule.partNumber)).toEqual(['HH3131K810','HH3130NP10']);
  });

  it('HOIST GEAR BOX(350X)の31行を6件のユニークPLに統合する', () => {
    const hoistRules = sampleData.rules.filter((rule) => rule.unitNo === '200');
    expect(hoistRules.map((rule) => rule.partNumber)).toEqual(['HH12000010','HH12000110','HH12000210','HH3201SG10','* NO USE','HH120A0010']);
    expect(hoistRules.find((rule) => rule.partNumber === 'HH12000010')?.conditions).toMatchObject({S051:['S051-2'],S055:['S055-1']});
    expect(hoistRules.find((rule) => rule.partNumber === 'HH3201SG10')?.conditions).toMatchObject({S001:['S001-9','S001-10'],S051:['S051-3'],S055:['S055-2']});
    expect(hoistRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(hoistRules.find((rule) => rule.partNumber === 'HH120A0010')?.conditions.S001).toEqual(['S001-11']);
  });

  it('HOIST BASE UNIT(350X)の40行を5件のユニークPLに統合する', () => {
    const baseRules = sampleData.rules.filter((rule) => rule.unitNo === '210');
    expect(baseRules.map((rule) => rule.partNumber)).toEqual(['HH12100010','HH12100110','HH12100210','HH32109R10','* NO USE']);
    expect(baseRules.find((rule) => rule.partNumber === 'HH12100010')?.conditions).toMatchObject({S051:['S051-2'],S025:['S025-1']});
    expect(baseRules.find((rule) => rule.partNumber === 'HH12100110')?.conditions).toMatchObject({S051:['S051-1'],S025:['S025-1']});
    expect(baseRules.find((rule) => rule.partNumber === 'HH12100210')?.conditions).toMatchObject({S051:['S051-3'],S025:['S025-1']});
    expect(baseRules.find((rule) => rule.partNumber === 'HH32109R10')?.conditions).toMatchObject({S001:['S001-1','S001-2','S001-3','S001-8','S001-9','S001-10'],S051:['S051-3'],S025:['S025-2','S025-3']});
    expect(baseRules.find((rule) => rule.partNumber === 'HH32109R10')?.note).toBe('TI Lehi、Manassas、CanSemi、Catania（ラテラルロング）で使用');
    expect(baseRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(baseRules.find((rule) => rule.partNumber === '* NO USE')?.conditions.S001).toEqual(['S001-7']);
  });

  it('HOIST DRUM UNIT(350X)の25行を5件のユニークPLに統合する', () => {
    const drumRules = sampleData.rules.filter((rule) => rule.unitNo === '220');
    expect(drumRules.map((rule) => rule.partNumber)).toEqual(['HH12201010','HH12201110','HH12202010','HH12202110','* NO USE']);
    expect(drumRules.find((rule) => rule.partNumber === 'HH12201010')?.conditions).toMatchObject({S016:['S016-1'],S050:['S050-2']});
    expect(drumRules.find((rule) => rule.partNumber === 'HH12201110')?.conditions).toMatchObject({S016:['S016-1'],S050:['S050-1']});
    expect(drumRules.find((rule) => rule.partNumber === 'HH12202010')?.conditions).toMatchObject({S001:['S001-8','S001-9','S001-10'],S016:['S016-2'],S050:['S050-2']});
    expect(drumRules.find((rule) => rule.partNumber === 'HH12202110')?.conditions).toMatchObject({S001:['S001-8','S001-9','S001-10'],S016:['S016-2'],S050:['S050-1']});
    expect(drumRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(drumRules.find((rule) => rule.partNumber === '* NO USE')?.conditions.S001).toEqual(['S001-7']);
  });

  it('HOIST SENSOR UNIT(350X)の57行を22件のユニークPLに統合する', () => {
    const sensorRules = sampleData.rules.filter((rule) => rule.unitNo === '230');
    expect(sensorRules.map((rule) => rule.partNumber)).toEqual([
      'HH12301010','HH12302010','HH32328M10','HH3230CB10','HH3230DH10','HH3230FN10','HH3230GN10',
      'HH3230GP10','HH3230HD10','HH3230KN10','HH3232AP10','HH3230HQ10','HH3230HR10','HH3231JE10',
      'HH3230L210','HH3230L910','HH3231L910','HH3230TT10','HH3230RJ10','HH3230SP10','* NO USE','HH3230G710',
    ]);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH12301010')?.conditions).toMatchObject({S015:['S015-1'],S003:['S003-1'],S036:['S036-1'],S009:['S009-1'],S041:['S041-1','S041-2'],S020:['S020-1'],S044:['S044-1'],S016:['S016-1','S016-2'],S027:['S027-1']});
    expect(sensorRules.find((rule) => rule.partNumber === 'HH12302010')?.conditions.S036).toBeUndefined();
    expect(sensorRules.find((rule) => rule.partNumber === 'HH12302010')?.conditions).toMatchObject({S015:['S015-2'],S016:['S016-1','S016-2']});
    expect(sensorRules.find((rule) => rule.partNumber === 'HH32328M10')?.note).toBe('Infineon dresdenは非改造');
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3230GN10')?.conditions.S044).toEqual(['S044-2']);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3230TT10')?.conditions.S027).toEqual(['S027-2']);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3232AP10')?.conditions.S003).toEqual(['S003-2']);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3230SP10')?.selectable).toBe(false);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3230SP10')?.note).toBe('HH12302010に統一');
    expect(sensorRules.find((rule) => rule.partNumber === '* NO USE')?.conditions.S001).toEqual(['S001-7']);
    expect(sensorRules.find((rule) => rule.partNumber === 'HH3230G710')?.selectable).toBe(false);
  });

  it('CENTER FRAMEの48行を18件のユニークPLに統合する', () => {
    const frameRules = sampleData.rules.filter((rule) => rule.unitNo === '300');
    expect(frameRules.map((rule) => rule.partNumber)).toEqual([
      'HH13011010','HH3300A510','HH3300CB10','HH3300AP10','HH3301RJ10','HH13012010','HH13041010','HH13042010',
      'HH13021010','HH13031010','HH13031110','HH13031210','HH3300CF10','HH3301CF10','HH3300LK10',
      'HH13021110','HH13021210','HH3300DG10',
    ]);
    expect(frameRules.find((rule) => rule.partNumber === 'HH13011010')?.conditions.S026).toBeUndefined();
    expect(frameRules.find((rule) => rule.partNumber === 'HH13011010')?.conditions.S018).toBeUndefined();
    expect(frameRules.find((rule) => rule.partNumber === 'HH13041010')?.conditions).toMatchObject({S001:['S001-7'],S012:['S012-1'],S003:['S003-2']});
    expect(frameRules.find((rule) => rule.partNumber === 'HH13021010')?.selectable).toBe(false);
    expect(frameRules.find((rule) => rule.partNumber === 'HH13021010')?.note).toBe('HH13021110 or HH13021210を選択');
    expect(frameRules.find((rule) => rule.partNumber === 'HH13031210')?.conditions).toMatchObject({S018:['S018-1','S018-2','S018-4'],S062:['S062-2','S062-4']});
    expect(frameRules.find((rule) => rule.partNumber === 'HH3300CF10')?.selectable).toBe(false);
    expect(frameRules.find((rule) => rule.partNumber === 'HH3300CF10')?.note).toBe('廃番　HH3301CF10へ統合');
    expect(frameRules.find((rule) => rule.partNumber === 'HH13021110')?.conditions.S018).toEqual(['S018-3']);
    expect(frameRules.find((rule) => rule.partNumber === 'HH3300DG10')?.conditions.S058).toEqual(['S058-2']);
  });
});
