import { describe, expect, it } from 'vitest';
import { sampleData } from './sample';

describe('sample master data', () => {
  it('仕様No.1～66を重複なく保持する', () => {
    expect(sampleData.specifications.map((specification) => specification.no)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
  });

  it('提示されたユニットを指定順で保持する', () => {
    expect(sampleData.units.map((unit) => unit.no)).toEqual([
      '100', '111', '110', '120', '131', '130', '200', '210', '220', '230', '300', '310', '320', '350',
      '360', '370', '400', '420', '421', '500', '600', '700', '710', '900', '140', '390', '720',
    ]);
  });
});
