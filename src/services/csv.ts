import type { MasterData, PLRule, Specification, Unit, UnitResult } from '../types';

const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export function toCsv(rows: string[][]): string { return '\uFEFF' + rows.map((r) => r.map(quote).join(',')).join('\r\n'); }
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) { const c = source[i]; if (c === '"' && quoted && source[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = !quoted; else if (c === ',' && !quoted) { row.push(cell); cell = ''; } else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && source[i + 1] === '\n') i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; } else cell += c; }
  row.push(cell); if (row.some(Boolean)) rows.push(row); return rows;
}
export type MasterKind = 'specifications' | 'units' | 'rules';
export function exportMaster(data: MasterData, kind: MasterKind): string {
  if (kind === 'specifications') return toCsv([['仕様No.','仕様項目名','選択肢（|区切り）','表示順','備考'], ...data.specifications.map((x) => [String(x.no),x.name,x.options.join('|'),String(x.order),x.note])]);
  if (kind === 'units') return toCsv([['ユニットNo.','ユニット名','表示順','備考'], ...data.units.map((x) => [x.no,x.name,String(x.order),x.note])]);
  const specificationNumbers = data.specifications.map((x) => String(x.no)); return toCsv([['ユニットNo.','PL品番','PL名称','備考',...specificationNumbers], ...data.rules.map((x) => [x.unitNo,x.partNumber,x.name,x.note,...specificationNumbers.map((no) => x.conditions[no] ?? '')])]);
}
export function importMaster(text: string, kind: MasterKind): Specification[] | Unit[] | PLRule[] {
  const [header, ...rows] = parseCsv(text); if (!header) throw new Error('CSVが空です。');
  if (kind === 'specifications') {
    const specifications = rows.map((r) => ({ no:Number(r[0]), name:r[1], options:(r[2]??'').split('|').filter(Boolean), order:Number(r[3]), note:r[4]??'' }));
    if (specifications.some((item) => !Number.isInteger(item.no) || item.no < 1)) throw new Error('仕様No.は1以上の整数で入力してください。');
    if (new Set(specifications.map((item) => item.no)).size !== specifications.length) throw new Error('仕様No.が重複しています。');
    return specifications;
  }
  if (kind === 'units') return rows.map((r) => ({ no:r[0], name:r[1], order:Number(r[2]), note:r[3]??'' }));
  if (header.slice(4).some((value) => !/^\d+$/.test(value))) throw new Error('PL選定条件の5列目以降は仕様No.を指定してください。');
  return rows.map((r, i) => ({ id:`csv-${Date.now()}-${i}`, unitNo:r[0], partNumber:r[1], name:r[2], note:r[3]??'', conditions:Object.fromEntries(header.slice(4).map((code,j) => [code,r[j+4]??'']).filter(([,v]) => v)) }));
}
export function exportResults(results: UnitResult[]): string { return toCsv([['No.','ユニット名','選定PL品番','判定状態','備考'], ...results.map((r) => [r.unit.no,r.unit.name,r.confirmedPartNumber ?? (r.status === 'selected' ? r.candidates[0].partNumber : r.candidates.map((x) => x.partNumber).join(' / ')),r.status === 'selected'?'選定済み':r.status === 'multiple'?'複数候補あり':'候補なし',r.unit.note])]); }
export function downloadCsv(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type:'text/csv;charset=utf-8' })); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
