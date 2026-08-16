import type { MasterData } from '../types';

export const sampleData: MasterData = {
  specifications: [
    { code: 'MODEL', name: '型式', options: ['SRC350-M2-3X-F', 'SRC350-M2-3X-R', 'SRC350-M2-4X-F'], order: 1, note: '仕様書に記載された型式を選択してください。' },
    { code: 'LAYOUT', name: 'レイアウト', options: ['CW', 'CCW'], order: 2, note: '設備を上から見た搬送方向です。' },
    { code: 'LOAD', name: '搬送物', options: ['FOUP', 'Reticle'], order: 3, note: '搬送する容器の種類です。' },
    { code: 'WEIGHT', name: '最大重量', options: ['10kg以下', '13kg以下', '20kg以下'], order: 4, note: '搬送物を含む最大重量です。' },
    { code: 'GUIDE', name: '直動ガイド', options: ['IKO', 'THK', 'HIWIN'], order: 5, note: '指定メーカーを確認してください。' },
    { code: 'BRANCH', name: '分岐リニアガイド', options: ['標準', '強化版'], order: 6, note: '分岐部のガイド仕様です。' },
    { code: 'STROKE', name: '昇降ストローク', options: ['ST2800', 'ST4200', 'ST5500'], order: 7, note: '仕様書の昇降ロングSTを確認してください。' },
    { code: 'MODEM', name: 'モデム・結合機', options: ['日米台湾仕様', '中国仕様', '欧州仕様'], order: 8, note: '仕向地に対応する仕様です。' },
    { code: 'RFID', name: 'RFIDタグ方向', options: ['縦', '横', '縦横混在', '無し'], order: 9, note: 'タグ無しの場合も「無し」を選択してください。' },
  ],
  units: [
    { no: '100', name: 'DRIVE GEAR BOX (350X)', order: 1, note: '駆動ギアボックス' },
    { no: '110', name: 'STEERING UNIT (F)', order: 2, note: '前側ステアリング' },
    { no: '130', name: 'DIVERGE UNIT (F)', order: 3, note: '分岐ユニット' },
    { no: '200', name: 'HOIST GEAR BOX (350X)', order: 4, note: '昇降ギアボックス' },
    { no: '700', name: 'COVER', order: 5, note: '外装カバー' },
  ],
  rules: [
    { id: 'r1', unitNo: '100', partNumber: 'HH11101B10', name: 'ドライブギアボックス F', note: 'F型用', conditions: { MODEL: 'SRC350-M2-3X-F', GUIDE: 'IKO' } },
    { id: 'r2', unitNo: '100', partNumber: 'HH11102B10', name: 'ドライブギアボックス R', note: 'R型用', conditions: { MODEL: 'SRC350-M2-3X-R', GUIDE: 'IKO' } },
    { id: 'r3', unitNo: '110', partNumber: 'HH21101A10', name: 'ステアリング標準', note: '標準搬送', conditions: { LOAD: 'FOUP', WEIGHT: '10kg以下' } },
    { id: 'r4', unitNo: '110', partNumber: 'HH21102A10', name: 'ステアリング重量対応', note: '重量対応品', conditions: { LOAD: 'FOUP', WEIGHT: '20kg以下' } },
    { id: 'r5', unitNo: '130', partNumber: 'HH31101C10', name: '分岐ガイド標準A', note: '標準候補A', conditions: { BRANCH: '標準', LAYOUT: 'CW' } },
    { id: 'r6', unitNo: '130', partNumber: 'HH31102C10', name: '分岐ガイド標準B', note: '要設計確認', conditions: { BRANCH: '標準', LAYOUT: 'CW' } },
    { id: 'r7', unitNo: '200', partNumber: 'HH41101D10', name: 'ホイスト ST2800', note: '', conditions: { STROKE: 'ST2800' } },
    { id: 'r8', unitNo: '200', partNumber: 'HH41102D10', name: 'ホイスト ST4200', note: '', conditions: { STROKE: 'ST4200' } },
    { id: 'r9', unitNo: '700', partNumber: 'HH71101H10', name: 'RFID縦カバー', note: 'タグ干渉を確認', conditions: { RFID: '縦' } },
    { id: 'r10', unitNo: '700', partNumber: 'HH71102H10', name: 'RFID横カバー', note: '', conditions: { RFID: '横' } },
  ],
};
