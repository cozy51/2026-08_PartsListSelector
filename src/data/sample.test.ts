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

  it('FRONT FRAMEの176行を88件のユニークPLに統合する', () => {
    const frontRules = sampleData.rules.filter((rule) => rule.unitNo === '310');
    expect(frontRules).toHaveLength(88);
    expect(new Set(frontRules.map((rule) => rule.partNumber)).size).toBe(88);
    expect(frontRules.find((rule) => rule.partNumber === '■NG')?.selectable).toBe(false);
    expect(frontRules.find((rule) => rule.partNumber === '■NG')?.note).toBe('3X系にはID-Rは付けられない');
    expect(frontRules.find((rule) => rule.partNumber === '■NG')?.conditions).toMatchObject({S001:['S001-1'],S019:['S019-1','S019-2','S019-3']});
    expect(frontRules.find((rule) => rule.partNumber === 'HH3310A410')?.selectable).toBe(false);
    expect(frontRules.find((rule) => rule.partNumber === 'HH3310A410')?.note).toBe('DBキャンセルボタン有で統一');
    expect(frontRules.find((rule) => rule.partNumber === 'HH3310A410')?.conditions).toEqual({});
    expect(frontRules.find((rule) => rule.partNumber === 'HH3310DB10')?.selectable).toBe(false);
    expect(frontRules.find((rule) => rule.partNumber === 'HH13181010')?.conditions.S007).toBeUndefined();
    expect(frontRules.find((rule) => rule.partNumber === 'HH13181010')?.conditions).toMatchObject({S001:['S001-7'],S003:['S003-2']});
    expect(frontRules.find((rule) => rule.partNumber === 'HH3310GR10')?.conditions.S007).toEqual(['S007-8','S007-14','S007-26']);
    expect(frontRules.find((rule) => rule.partNumber === 'HH3311G710')?.note).toBe('差）HH13114010：風船64を削除／差）HH13114010：ID-Rブラケットを削除');
    expect(frontRules.find((rule) => rule.partNumber === 'HH33128M10')?.conditions.S060).toEqual(['S060-2']);
  });

  it('REAR FRAMEの79行を54件のユニークPLに統合する', () => {
    const rearRules = sampleData.rules.filter((rule) => rule.unitNo === '320');
    expect(rearRules).toHaveLength(54);
    expect(new Set(rearRules.map((rule) => rule.partNumber)).size).toBe(54);
    expect(rearRules.find((rule) => rule.partNumber === 'HH3321EZ10')?.selectable).toBe(false);
    expect(rearRules.find((rule) => rule.partNumber === 'HH3321EZ10')?.note).toBe('HH13215H10に統合');
    expect(rearRules.find((rule) => rule.partNumber === 'HH3321EZ10')?.conditions).toEqual({});
    expect(rearRules.find((rule) => rule.partNumber === 'HH33228M10')?.selectable).toBe(false);
    expect(rearRules.find((rule) => rule.partNumber === 'HH13230010')?.conditions.S062).toEqual(['S062-2']);
    expect(rearRules.find((rule) => rule.partNumber === 'HH3320CB10')?.note).toBe('ウィンカーがIKO');
    expect(rearRules.find((rule) => rule.partNumber === 'HH3320CB10')?.conditions.S019).toEqual(['S019-5','S019-4']);
    expect(rearRules.find((rule) => rule.partNumber === 'HH3322GP10')?.conditions).toMatchObject({S020:['S020-2'],S036:['S036-2'],S037:['S037-2']});
  });

  it('FEEDER UNITの47行を14件のユニークPLに統合する', () => {
    const feederRules = sampleData.rules.filter((rule) => rule.unitNo === '350');
    expect(feederRules.map((rule) => rule.partNumber)).toEqual([
      'HH13501010','HH13501110','HH13501210','HH13501310','HH3350SV10','HH3351MT10',
      'HH13502010','HH13502110','HH13502210','HH13502310',
      'HH135A1010','HH135A1110','HH135A1210','HH135A1310',
    ]);
    expect(feederRules.find((rule) => rule.partNumber === 'HH13501010')?.conditions).toEqual({S001:['S001-7','S001-8','S001-9','S001-10'],S018:['S018-1']});
    expect(feederRules.find((rule) => rule.partNumber === 'HH3350SV10')?.note).toBe('新型モデム先行適用／TI(SFAB)のみ');
    expect(feederRules.find((rule) => rule.partNumber === 'HH3350SV10')?.conditions).toEqual({S001:['S001-8'],S018:['S018-4']});
    expect(feederRules.find((rule) => rule.partNumber === 'HH3351MT10')?.conditions.S001).toEqual(['S001-9','S001-8']);
    expect(feederRules.find((rule) => rule.partNumber === 'HH135A1010')?.conditions).toEqual({S001:['S001-11'],S018:['S018-1']});
  });

  it('LAN UNIT(350X)の46行を6件のユニークPLに統合する', () => {
    const lanRules = sampleData.rules.filter((rule) => rule.unitNo === '360');
    expect(lanRules.map((rule) => rule.partNumber)).toEqual(['HH13600010','HH3360G410','* NO USE','HH13601010','HH136A0010','HH33605H10']);
    expect(lanRules.find((rule) => rule.partNumber === 'HH13600010')?.note).toBe('在庫処理済のため　HH33605H10 ⇒　HH13600010　へ変更(20260702:wtanabe)');
    expect(lanRules.find((rule) => rule.partNumber === 'HH13600010')?.conditions.S018).toEqual(['S018-2','S018-1','S018-3','S018-4']);
    expect(lanRules.find((rule) => rule.partNumber === 'HH3360G410')?.conditions).toEqual({S001:['S001-10'],S003:['S003-2'],S018:['S018-1']});
    expect(lanRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(lanRules.find((rule) => rule.partNumber === '* NO USE')?.conditions).toEqual({S001:['S001-7'],S003:['S003-2']});
    expect(lanRules.find((rule) => rule.partNumber === 'HH13601010')?.selectable).toBe(false);
    expect(lanRules.find((rule) => rule.partNumber === 'HH33605H10')?.selectable).toBe(false);
    expect(lanRules.find((rule) => rule.partNumber === 'HH136A0010')?.conditions.S018).toBeUndefined();
  });

  it('E-84関係の92行を5件のユニークPLに統合する', () => {
    const e84Rules = sampleData.rules.filter((rule) => rule.unitNo === '370');
    expect(e84Rules.map((rule) => rule.partNumber)).toEqual(['HH13701010','HH13702010','HH13703010','HH3370DG10','* NO USE']);
    expect(e84Rules.find((rule) => rule.partNumber === 'HH13701010')?.conditions.S007).toHaveLength(22);
    expect(e84Rules.find((rule) => rule.partNumber === 'HH13701010')?.conditions).toMatchObject({S017:['S017-1'],S003:['S003-1'],S058:['S058-2']});
    expect(e84Rules.find((rule) => rule.partNumber === 'HH13702010')?.conditions).toMatchObject({S017:['S017-1'],S058:['S058-1']});
    expect(e84Rules.find((rule) => rule.partNumber === 'HH13703010')?.conditions.S017).toEqual(['S017-2']);
    expect(e84Rules.find((rule) => rule.partNumber === 'HH3370DG10')?.conditions.S007).toEqual(['S007-1','S007-27','S007-2']);
    expect(e84Rules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(e84Rules.find((rule) => rule.partNumber === '* NO USE')?.conditions).toEqual({S001:['S001-7']});
  });

  it('THETA UNIT(350X)の39行を6件のユニークPLに統合する', () => {
    const thetaRules = sampleData.rules.filter((rule) => rule.unitNo === '400');
    expect(thetaRules.map((rule) => rule.partNumber)).toEqual(['* NO USE','HH14000010','HH14000H10','HH3404AP10','HH3400EG10','HH34009R10']);
    expect(thetaRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(thetaRules.find((rule) => rule.partNumber === 'HH14000010')?.conditions).toMatchObject({S013:['S013-1'],S003:['S003-1'],S025:['S025-1'],S026:['S026-5','S026-1']});
    expect(thetaRules.find((rule) => rule.partNumber === 'HH14000H10')?.conditions.S026).toEqual(['S026-5','S026-1','S026-4','S026-2']);
    expect(thetaRules.find((rule) => rule.partNumber === 'HH3404AP10')?.conditions.S003).toEqual(['S003-2']);
    expect(thetaRules.find((rule) => rule.partNumber === 'HH3400EG10')?.note).toBe('超ラテラルロングST対応');
    expect(thetaRules.find((rule) => rule.partNumber === 'HH3400EG10')?.conditions).toMatchObject({S026:['S026-3'],S001:['S001-9']});
    expect(thetaRules.find((rule) => rule.partNumber === 'HH34009R10')?.note).toBe('TI Lehi特殊');
    expect(thetaRules.find((rule) => rule.partNumber === 'HH34009R10')?.conditions).toMatchObject({S025:['S025-2','S025-3'],S001:['S001-8','S001-1']});
  });

  it('LATERAL UNIT(350X)の86行を10件のユニークPLに統合する', () => {
    const lateralRules = sampleData.rules.filter((rule) => rule.unitNo === '420');
    expect(lateralRules.map((rule) => rule.partNumber)).toEqual([
      '* NO USE','HH14200010','HH14200H10','HH14202H10','HH34209R10','HH3420A510','HH3420DG10','HH3420EG10','HH3424AP10','HH3420UD10',
    ]);
    expect(lateralRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(lateralRules.find((rule) => rule.partNumber === 'HH14200010')?.conditions.S026).toEqual(['S026-5','S026-1','S026-2']);
    expect(lateralRules.find((rule) => rule.partNumber === 'HH14200H10')?.conditions.S026).toEqual(['S026-5','S026-1','S026-4','S026-2']);
    expect(lateralRules.find((rule) => rule.partNumber === 'HH14202H10')?.conditions).toMatchObject({S061:['S061-2'],S001:['S001-4','S001-5','S001-6']});
    expect(lateralRules.find((rule) => rule.partNumber === 'HH3420DG10')?.selectable).toBe(false);
    expect(lateralRules.find((rule) => rule.partNumber === 'HH3420DG10')?.note).toBe('MSA特殊→HH14202H10へ');
    expect(lateralRules.find((rule) => rule.partNumber === 'HH3420DG10')?.conditions).toEqual({});
    expect(lateralRules.find((rule) => rule.partNumber === 'HH3424AP10')?.conditions).toMatchObject({S003:['S003-2'],S028:['S028-2']});
    expect(lateralRules.find((rule) => rule.partNumber === 'HH3420UD10')?.conditions.S066).toEqual(['S066-2']);
  });

  it('LATERAL GEAR BOX (350X)の19行を3件のユニークPLに統合する', () => {
    const gearBoxRules = sampleData.rules.filter((rule) => rule.unitNo === '421');
    expect(gearBoxRules.map((rule) => rule.partNumber)).toEqual(['* NO USE','HH14210010','HH3421AP10']);
    expect(gearBoxRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(gearBoxRules.find((rule) => rule.partNumber === 'HH14210010')?.conditions).toEqual({S001:['S001-1','S001-2','S001-3','S001-4','S001-5','S001-6','S001-8','S001-9','S001-10'],S003:['S003-1']});
    expect(gearBoxRules.find((rule) => rule.partNumber === 'HH3421AP10')?.conditions.S003).toEqual(['S003-2']);
  });

  it('CRADLE(350X)の38行を28件のユニークPLに統合する', () => {
    const cradleRules = sampleData.rules.filter((rule) => rule.unitNo === '500');
    expect(cradleRules).toHaveLength(28);
    expect(new Set(cradleRules.map((rule) => rule.partNumber)).size).toBe(28);
    expect(cradleRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501AG10')?.selectable).toBe(false);
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501AG10')?.note).toBe('HH35028M10へ統合');
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501AG10')?.conditions).toEqual({});
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501GP10')?.note).toBe('Infinoen AG');
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501GP10')?.conditions).toMatchObject({S004:['S004-1'],S005:['S005-2'],S037:['S037-2']});
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3500VH10')?.conditions).toMatchObject({S001:['S001-10','S001-6'],S013:['S013-3','S013-2']});
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501VK10')?.conditions.S007).toBeUndefined();
    expect(cradleRules.find((rule) => rule.partNumber === 'HH3501TT10')?.conditions.S027).toEqual(['S027-2']);
  });

  it('HAND(350X)の60行を52件のユニークPLに統合する', () => {
    const handRules = sampleData.rules.filter((rule) => rule.unitNo === '600');
    expect(handRules).toHaveLength(52);
    expect(new Set(handRules.map((rule) => rule.partNumber)).size).toBe(52);
    expect(handRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(handRules.find((rule) => rule.partNumber === 'HH3601DA10')?.selectable).toBe(false);
    expect(handRules.find((rule) => rule.partNumber === 'HH3601DA10')?.note).toBe('HH3600DA40に統合');
    expect(handRules.find((rule) => rule.partNumber === 'HH3600CB10→HH3602AP10')?.selectable).toBe(false);
    expect(handRules.find((rule) => rule.partNumber === 'HH3600CB10→HH3602AP10')?.note).toBe('HH3602AP10に統合');
    expect(handRules.find((rule) => rule.partNumber === 'HH3600CB10→HH3602AP10')?.conditions).toEqual({});
    expect(handRules.find((rule) => rule.partNumber === 'HH160A0010')?.conditions).toMatchObject({S001:['S001-11'],S008:['S008-1']});
    expect(handRules.find((rule) => rule.partNumber === 'HH160A0010')?.conditions.S037).toBeUndefined();
    expect(handRules.find((rule) => rule.partNumber === 'HH3601UU10')?.note).toBe('SMIF HAND／落下防止強化PL');
    expect(handRules.find((rule) => rule.partNumber === 'HH36028M10')?.conditions.S007).toEqual(['S007-2','S007-5']);
  });

  it('COVERの66行を50件のユニークPLに統合する', () => {
    const coverRules = sampleData.rules.filter((rule) => rule.unitNo === '700');
    expect(coverRules).toHaveLength(50);
    expect(new Set(coverRules.map((rule) => rule.partNumber)).size).toBe(50);
    expect(coverRules.find((rule) => rule.partNumber === 'HH3700BS10')?.selectable).toBe(false);
    expect(coverRules.find((rule) => rule.partNumber === 'HH3700BS10')?.note).toBe('HH17011010に統合');
    expect(coverRules.find((rule) => rule.partNumber === 'HH3701AG10')?.selectable).toBe(false);
    expect(coverRules.find((rule) => rule.partNumber === 'HH3701EZ10')?.selectable).toBe(false);
    expect(coverRules.find((rule) => rule.partNumber === 'HH3700EG10')?.conditions.S025).toEqual(['S025-2','S025-3']);
    expect(coverRules.find((rule) => rule.partNumber === 'HH3700A510')?.conditions).toMatchObject({S004:['S004-1','S004-2'],S005:['S005-2','S005-1']});
    expect(coverRules.find((rule) => rule.partNumber === 'HH17013H10')?.conditions.S022).toEqual(['S022-3']);
  });

  it('HAZARD LABELの183行を20件のユニークPLに統合する', () => {
    const hazardRules = sampleData.rules.filter((rule) => rule.unitNo === '710');
    expect(hazardRules).toHaveLength(20);
    expect(new Set(hazardRules.map((rule) => rule.partNumber)).size).toBe(20);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH17120010')?.conditions).toEqual({S030:['S030-2']});
    expect(hazardRules.find((rule) => rule.partNumber === 'HH17121010')?.conditions).toEqual({S030:['S030-1']});
    expect(hazardRules.find((rule) => rule.partNumber === 'HH17110A10')?.conditions.S001).toHaveLength(9);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH3714AP10')?.conditions.S001).toEqual(['S001-7','S001-1','S001-2','S001-3','S001-4','S001-5','S001-6','S001-8','S001-9','S001-10']);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH3710J910')?.conditions.S001).toEqual(['S001-8','S001-9']);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH3710J910')?.note).toBe('KX仕様　(旧文言対応)');
    expect(hazardRules.find((rule) => rule.partNumber === 'HH37118S10')?.selectable).toBe(false);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH3710FN10')?.selectable).toBe(false);
    expect(hazardRules.find((rule) => rule.partNumber === 'HH3710FN10')?.note).toBe('HH17110B10　に統合');
  });

  it('CARRY WAGON(SRC350)の23行を5件のユニークPLに統合する', () => {
    const wagonRules = sampleData.rules.filter((rule) => rule.unitNo === '900');
    expect(wagonRules.map((rule) => rule.partNumber)).toEqual(['HH09201310','HH09201010','HH3920FN10','HH3921RJ10','HH3920VK10']);
    expect(wagonRules.find((rule) => rule.partNumber === 'HH09201310')?.conditions).toEqual({S001:['S001-7']});
    expect(wagonRules.find((rule) => rule.partNumber === 'HH09201010')?.conditions.S009).toEqual(['S009-1','S009-2']);
    expect(wagonRules.find((rule) => rule.partNumber === 'HH09201010')?.conditions.S007).toHaveLength(11);
    expect(wagonRules.find((rule) => rule.partNumber === 'HH3921RJ10')?.note).toBe('PBN');
    expect(wagonRules.find((rule) => rule.partNumber === 'HH3920VK10')?.conditions.S007).toEqual(['S007-25','S007-16','S007-17']);
  });

  it('CLEANING NOZZLE UNITの11行を2件のユニークPLに統合する', () => {
    const nozzleRules = sampleData.rules.filter((rule) => rule.unitNo === '140');
    expect(nozzleRules.map((rule) => rule.partNumber)).toEqual(['HH11401010','* NO USE']);
    expect(nozzleRules.find((rule) => rule.partNumber === 'HH11401010')?.conditions).toEqual({S001:['S001-7']});
    expect(nozzleRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
    expect(nozzleRules.find((rule) => rule.partNumber === '* NO USE')?.conditions.S001).toEqual(['S001-1','S001-2','S001-3','S001-4','S001-5','S001-6','S001-8','S001-9','S001-10','S001-11']);
  });

  it('CLEANER UNITの13行を4件のユニークPLに統合する', () => {
    const cleanerRules = sampleData.rules.filter((rule) => rule.unitNo === '390');
    expect(cleanerRules.map((rule) => rule.partNumber)).toEqual(['HH13901010','HH13902010','HH13911010','* NO USE']);
    expect(cleanerRules.find((rule) => rule.partNumber === 'HH13901010')?.conditions).toEqual({S001:['S001-7'],S003:['S003-1'],S002:['S002-1']});
    expect(cleanerRules.find((rule) => rule.partNumber === 'HH13902010')?.conditions).toEqual({S001:['S001-7'],S003:['S003-1'],S002:['S002-2']});
    expect(cleanerRules.find((rule) => rule.partNumber === 'HH13911010')?.conditions).toEqual({S001:['S001-7'],S003:['S003-2'],S002:['S002-2']});
    expect(cleanerRules.find((rule) => rule.partNumber === '* NO USE')?.selectable).toBe(false);
  });
});
