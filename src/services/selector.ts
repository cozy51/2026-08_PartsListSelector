import type { Candidate, MasterData, Selection, UnitResult } from '../types';

export function selectParts(data: MasterData, selection: Selection): UnitResult[] {
  return [...data.units].sort((a, b) => a.order - b.order).map((unit) => {
    const evaluated: Candidate[] = data.rules.filter((rule) => rule.unitNo === unit.no && rule.selectable).map((rule) => ({
      ...rule,
      details: Object.entries(rule.conditions).filter(([, expected]) => expected.length > 0).map(([specificationCode, expected]) => ({
        specificationCode, expected, actual: selection[specificationCode] ?? '', missing: !selection[specificationCode], matched: expected.includes(selection[specificationCode]),
      })),
    }));
    const candidates = evaluated.filter((rule) => rule.details.every((condition) => condition.matched));
    const relevant = candidates.length ? candidates : evaluated.filter((rule) => rule.details.every((c) => c.matched || c.missing));
    const missingSpecificationCodes = [...new Set(relevant.flatMap((rule) => rule.details.filter((condition) => condition.missing).map((condition) => condition.specificationCode)))];
    return { unit, candidates, nearCandidates: evaluated, status: candidates.length === 1 ? 'selected' : candidates.length > 1 ? 'multiple' : 'none', missingSpecificationCodes };
  });
}
