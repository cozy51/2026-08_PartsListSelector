import type { Candidate, MasterData, Selection, UnitResult } from '../types';

export function selectParts(data: MasterData, selection: Selection): UnitResult[] {
  return [...data.units].sort((a, b) => a.order - b.order).map((unit) => {
    const evaluated: Candidate[] = data.rules.filter((rule) => rule.unitNo === unit.no).map((rule) => ({
      ...rule,
      details: Object.entries(rule.conditions).filter(([, expected]) => expected !== '').map(([specificationNo, expected]) => ({
        specificationNo, expected, actual: selection[specificationNo] ?? '', missing: !selection[specificationNo], matched: selection[specificationNo] === expected,
      })),
    }));
    const candidates = evaluated.filter((rule) => rule.details.every((condition) => condition.matched));
    const relevant = candidates.length ? candidates : evaluated.filter((rule) => rule.details.every((c) => c.matched || c.missing));
    const missingSpecificationNos = [...new Set(relevant.flatMap((rule) => rule.details.filter((condition) => condition.missing).map((condition) => condition.specificationNo)))];
    return { unit, candidates, nearCandidates: evaluated, status: candidates.length === 1 ? 'selected' : candidates.length > 1 ? 'multiple' : 'none', missingSpecificationNos };
  });
}
