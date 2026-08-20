import type { UnitResult } from '../types';

export async function downloadResultsExcel(name: string, results: UnitResult[]): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('PL選定結果');
  sheet.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'ユニット名', key: 'unitName', width: 28 },
    { header: '選定PL品番', key: 'partNumber', width: 18 },
    { header: '判定状態', key: 'status', width: 14 },
    { header: '備考', key: 'note', width: 34 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const r of results) {
    sheet.addRow({
      no: r.unit.no,
      unitName: r.unit.name,
      partNumber: r.confirmedPartNumber ?? (r.status === 'selected' ? r.candidates[0].partNumber : r.candidates.map((x) => x.partNumber).join(' / ')),
      status: r.status === 'selected' ? '選定済み' : r.status === 'multiple' ? '複数候補あり' : '候補なし',
      note: r.unit.note,
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
