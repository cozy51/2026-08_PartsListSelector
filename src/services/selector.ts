import type { Candidate, MasterData, Selection, UnitResult } from '../types';

export function selectParts(data: MasterData, selection: Selection): UnitResult[] {
  return [...data.units].sort((a, b) => a.order - b.order).map((unit) => {
    const evaluated: Candidate[] = data.rules.filter((rule) => rule.unitNo === unit.no).map((rule) => ({
      ...rule,
      details: Object.entries(rule.conditions).filter(([, expected]) => expected !== '').map(([code, expected]) => ({
        code, expected, actual: selection[code] ?? '', missing: !selection[code], matched: selection[code] === expected,
      })),
    }));
    const candidates = evaluated.filter((rule) => rule.details.every((condition) => condition.matched));
    const relevant = candidates.length ? candidates : evaluated.filter((rule) => rule.details.every((c) => c.matched || c.missing));
    const missingCodes = [...new Set(relevant.flatMap((rule) => rule.details.filter((c) => c.missing).map((c) => c.code)))];
    return { unit, candidates, nearCandidates: evaluated, status: candidates.length === 1 ? 'selected' : candidates.length > 1 ? 'multiple' : 'none', missingCodes };
  });
}
