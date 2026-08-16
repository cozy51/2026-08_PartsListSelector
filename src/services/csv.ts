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
  if (kind === 'specifications') return toCsv([['仕様No.','仕様コード','仕様項目名','選択肢（コード=表示名、|区切り）','表示順','備考'], ...data.specifications.map((x) => [String(x.no),x.code,x.name,x.options.map((option) => `${option.code}=${option.label}`).join('|'),String(x.order),x.note])]);
  if (kind === 'units') return toCsv([['ユニットNo.','ユニット名','表示順','備考'], ...data.units.map((x) => [x.no,x.name,String(x.order),x.note])]);
  const specificationCodes = data.specifications.map((x) => x.code); return toCsv([['ユニットNo.','PL品番','PL名称','備考',...specificationCodes], ...data.rules.map((x) => [x.unitNo,x.partNumber,x.name,x.note,...specificationCodes.map((code) => x.conditions[code] ?? '')])]);
}
export function importMaster(text: string, kind: MasterKind): Specification[] | Unit[] | PLRule[] {
  const [header, ...rows] = parseCsv(text); if (!header) throw new Error('CSVが空です。');
  if (kind === 'specifications') {
    const specifications = rows.map((r) => ({ no:Number(r[0]), code:r[1], name:r[2], options:(r[3]??'').split('|').filter(Boolean).map((entry) => { const separator=entry.indexOf('='); if(separator<1) throw new Error('選択肢は「S001-1=表示名」の形式で入力してください。'); return { code:entry.slice(0,separator), label:entry.slice(separator+1) }; }), order:Number(r[4]), note:r[5]??'' }));
    if (specifications.some((item) => !Number.isInteger(item.no) || item.no < 1)) throw new Error('仕様No.は1以上の整数で入力してください。');
    if (new Set(specifications.map((item) => item.no)).size !== specifications.length) throw new Error('仕様No.が重複しています。');
    if (specifications.some((item) => item.code !== `S${String(item.no).padStart(3,'0')}`)) throw new Error('仕様コードは仕様No.に対応するS001形式で入力してください。');
    if (specifications.some((item) => item.options.some((option,index) => option.code !== `${item.code}-${index+1}`))) throw new Error('選択肢コードはS001-1から順番に設定してください。');
    return specifications;
  }
  if (kind === 'units') return rows.map((r) => ({ no:r[0], name:r[1], order:Number(r[2]), note:r[3]??'' }));
  if (header.slice(4).some((value) => !/^S\d{3}$/.test(value))) throw new Error('PL選定条件の5列目以降はS001形式の仕様コードを指定してください。');
  return rows.map((r, i) => ({ id:`csv-${Date.now()}-${i}`, unitNo:r[0], partNumber:r[1], name:r[2], note:r[3]??'', conditions:Object.fromEntries(header.slice(4).map((code,j) => [code,r[j+4]??'']).filter(([,v]) => v)) }));
}
export function exportResults(results: UnitResult[]): string { return toCsv([['No.','ユニット名','選定PL品番','判定状態','備考'], ...results.map((r) => [r.unit.no,r.unit.name,r.confirmedPartNumber ?? (r.status === 'selected' ? r.candidates[0].partNumber : r.candidates.map((x) => x.partNumber).join(' / ')),r.status === 'selected'?'選定済み':r.status === 'multiple'?'複数候補あり':'候補なし',r.unit.note])]); }
export function downloadCsv(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type:'text/csv;charset=utf-8' })); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
