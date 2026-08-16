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
  });
});
