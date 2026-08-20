export type SpecificationOption = { code: string; label: string };
export type Specification = { no: number; code: string; name: string; options: SpecificationOption[]; order: number; reference: string; note: string };
export type Unit = { no: string; name: string; order: number; note: string };
export type PLRule = { id: string; unitNo: string; partNumber: string; note: string; selectable: boolean; conditions: Record<string, string[]> };
// appliedMigrations: 適用済みの移行処理ID。同じ移行処理が起動のたびに再適用され、
// ユーザーの編集内容がサンプル値へ巻き戻る（先祖返りする）のを防ぐための記録。
export type MasterData = { specifications: Specification[]; units: Unit[]; rules: PLRule[]; appliedMigrations?: string[] };
export type Selection = Record<string, string>;
export type AppSyncData = { schemaVersion: 1; masterData: MasterData; selection: Selection; syncedAt: string };
export type ConditionDetail = { specificationCode: string; expected: string[]; actual: string; matched: boolean; missing: boolean };
export type Candidate = PLRule & { details: ConditionDetail[] };
export type SelectionStatus = 'selected' | 'none' | 'multiple';
export type UnitResult = { unit: Unit; candidates: Candidate[]; nearCandidates: Candidate[]; status: SelectionStatus; missingSpecificationCodes: string[]; confirmedPartNumber?: string };
