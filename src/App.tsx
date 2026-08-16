import { useEffect, useMemo, useRef, useState } from 'react';
import { sampleData } from './data/sample';
import { exportMaster, exportResults, importMaster, downloadCsv, type MasterKind } from './services/csv';
import { selectParts } from './services/selector';
import { DB_NAME, DB_VERSION, loadMaster, saveMaster } from './services/storage';
import type { MasterData, Selection, UnitResult } from './types';

const statusLabel = { selected: '選定済み', multiple: '複数候補あり', none: '候補なし' } as const;
function App() {
  const [data, setData] = useState<MasterData>(sampleData); const [selection, setSelection] = useState<Selection>({});
  const [results, setResults] = useState<UnitResult[] | null>(null); const [active, setActive] = useState<UnitResult>();
  const [search, setSearch] = useState(''); const [tab, setTab] = useState<'select'|'master'>('select'); const [notice, setNotice] = useState('');
  const importRef = useRef<HTMLInputElement>(null); const [importKind, setImportKind] = useState<MasterKind>('specifications');
  useEffect(() => { loadMaster().then((saved) => { if (saved) setData(saved); else saveMaster(sampleData); }).catch(() => setNotice('IndexedDBを利用できないため、サンプルデータで起動しました。')); }, []);
  const specs = useMemo(() => [...data.specifications].sort((a,b) => a.order-b.order), [data]);
  const filtered = (results ?? []).filter((r) => `${r.unit.name} ${r.unit.note} ${r.candidates.map(c=>c.partNumber).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const updateData = async (next: MasterData) => { setData(next); await saveMaster(next); setNotice('マスターデータを保存しました。'); };
  const runSelection = () => { setResults(selectParts(data, selection)); setActive(undefined); setTimeout(() => document.getElementById('results')?.scrollIntoView({behavior:'smooth'})); };
  const confirm = (unitNo:string, partNumber:string) => setResults((old) => old?.map((r) => r.unit.no===unitNo ? {...r,confirmedPartNumber:partNumber}:r) ?? null);
  const onImport = async (file?:File) => { if (!file) return; try { const imported=importMaster(await file.text(),importKind); await updateData({...data,[importKind]:imported}); } catch(e) { setNotice(`取込エラー: ${e instanceof Error ? e.message:'形式を確認してください。'}`); } };
  return <div className="app">
    <header><div className="brand"><span className="logo">PL</span><div><h1>Parts List Selector</h1><p>仕様に適合する部品表を、ユニットごとに選定します</p></div></div><nav><button className={tab==='select'?'active':''} onClick={()=>setTab('select')}>仕様選択・結果</button><button className={tab==='master'?'active':''} onClick={()=>setTab('master')}>マスターデータ管理</button></nav></header>
    <main>{notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    {tab==='select' ? <>
      <section className="panel"><div className="section-heading"><div><span className="eyebrow">SPECIFICATIONS</span><h2>仕様選択</h2><p>各項目を選択してください。未選択の項目は空欄のまま選定できます。</p></div><span className="counter">{Object.values(selection).filter(Boolean).length} / {specs.length} 項目選択</span></div>
        <div className="spec-grid">{specs.map((spec,i)=><label className="spec-row" key={spec.code}><span className="number">{String(i+1).padStart(2,'0')}</span><span className="spec-info"><b>{spec.name}</b><small>{spec.note}</small></span><select value={selection[spec.code]??''} onChange={(e)=>setSelection({...selection,[spec.code]:e.target.value})}><option value="">未選択</option>{spec.options.map(o=><option key={o}>{o}</option>)}</select></label>)}</div>
        <div className="actions"><button className="secondary" onClick={()=>{setSelection({});setResults(null)}}>選択をクリア</button><button className="primary" onClick={runSelection}>PLを選定 <span>→</span></button></div>
      </section>
      {results && <section className="panel results" id="results"><div className="section-heading"><div><span className="eyebrow">SELECTION RESULTS</span><h2>PL選定結果</h2><div className="legend"><i className="dot green"/>選定済み <i className="dot amber"/>複数候補 <i className="dot red"/>候補なし</div></div><button className="secondary" onClick={()=>downloadCsv('PL選定結果.csv',exportResults(results))}>CSV出力</button></div>
        <div className="toolbar"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ユニット名・PL品番・備考を検索"/><b>{filtered.length} ユニット</b></div>
        <div className="table-wrap"><table><thead><tr><th>No.</th><th>ユニット名</th><th>選定されたPL品番</th><th>判定状態</th><th>備考</th></tr></thead><tbody>{filtered.map(r=><tr key={r.unit.no} className={r.status} onClick={()=>setActive(r)}><td>{r.unit.no}</td><td><button className="link">{r.unit.name}</button></td><td>{r.confirmedPartNumber ?? (r.status==='selected'?r.candidates[0].partNumber:r.status==='multiple'?r.candidates.map(c=>c.partNumber).join(' / '):'—')}</td><td><span className={`badge ${r.status}`}>{r.status==='selected'?'✓':'⚠'} {statusLabel[r.status]}</span>{r.missingCodes.length>0&&<small className="missing">不足: {r.missingCodes.map(c=>specs.find(s=>s.code===c)?.name??c).join('、')}</small>}</td><td>{r.unit.note}</td></tr>)}</tbody></table></div>
      </section>}
    </> : <MasterPanel data={data} onReset={()=>updateData(sampleData)} onExport={(k)=>downloadCsv(`${k}.csv`,exportMaster(data,k))} onImport={(k)=>{setImportKind(k);setTimeout(()=>importRef.current?.click())}} />}</main>
    <input hidden ref={importRef} type="file" accept=".csv,text/csv" onChange={e=>{onImport(e.target.files?.[0]);e.target.value=''}} />
    {active && <Detail result={active} specs={data.specifications} onClose={()=>setActive(undefined)} onConfirm={confirm}/>}<footer>ローカル保存: IndexedDB「{DB_NAME}」v{DB_VERSION}　｜　データはこのブラウザ内に保存されます</footer>
  </div>;
}

function MasterPanel({data,onReset,onExport,onImport}:{data:MasterData;onReset:()=>void;onExport:(k:MasterKind)=>void;onImport:(k:MasterKind)=>void}) { const blocks:[MasterKind,string,string,number][]=[['specifications','仕様項目マスター','仕様コード・項目名・選択肢・表示順・備考',data.specifications.length],['units','ユニットマスター','ユニットNo.・名称・表示順・備考',data.units.length],['rules','PL選定条件マスター','PL品番・名称・仕様コードごとの適合条件',data.rules.length]]; return <section className="panel"><div className="section-heading"><div><span className="eyebrow">MASTER DATA</span><h2>マスターデータ管理</h2><p>CSVの取り込みデータは検証後、ブラウザに永続保存されます。</p></div><button className="danger-outline" onClick={onReset}>サンプルに戻す</button></div><div className="master-grid">{blocks.map(([key,title,desc,count])=><article key={key}><span className="file-icon">▤</span><h3>{title}</h3><p>{desc}</p><strong>{count}<small> 件登録</small></strong><div><button className="secondary" onClick={()=>onImport(key)}>CSV取込</button><button className="secondary" onClick={()=>onExport(key)}>CSV出力</button></div></article>)}</div><div className="csv-help"><b>CSV取込について</b><p>CSV出力で得られるヘッダーと同じ形式で作成してください。取込時は対象マスターの登録内容を全件置き換えます。文字コードはUTF-8、選択肢は「|」区切りです。</p></div></section> }
function Detail({result,specs,onClose,onConfirm}:{result:UnitResult;specs:MasterData['specifications'];onClose:()=>void;onConfirm:(u:string,p:string)=>void}) { return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="drawer"><button className="close" onClick={onClose}>×</button><span className="eyebrow">UNIT {result.unit.no}</span><h2>{result.unit.name}</h2><p>{result.unit.note}</p><div className={`summary ${result.status}`}>{statusLabel[result.status]}<b>{result.candidates.length} 件</b></div><h3>PL候補と判定詳細</h3>{result.nearCandidates.length===0?<p className="empty">このユニットにはPL条件が登録されていません。</p>:result.nearCandidates.map(c=><article className={`candidate ${result.candidates.some(x=>x.id===c.id)?'eligible':''}`} key={c.id}><div><b>{c.partNumber}</b><span>{c.name}</span></div>{result.status==='multiple'&&result.candidates.some(x=>x.id===c.id)&&<button onClick={()=>onConfirm(result.unit.no,c.partNumber)}>このPLを選択</button>}<p>{c.note||'備考なし'}</p><table><tbody>{c.details.map(d=><tr key={d.code}><td>{d.matched?'✓':d.missing?'!':'×'}</td><td>{specs.find(s=>s.code===d.code)?.name??d.code}</td><td>条件: {d.expected}</td><td>選択: {d.actual||'未選択'}</td></tr>)}</tbody></table></article>)}</aside></div> }
export default App;
