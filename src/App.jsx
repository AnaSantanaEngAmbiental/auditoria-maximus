import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, FileText, Map as MapIcon, Globe, MapPin, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV58() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregar() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      const saved = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
    carregar();
  }, [projeto]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: `${f.name}-${Date.now()}` }));
    const listaAtual = JSON.parse(localStorage.getItem(`MAX_FILES_${projeto}`) || '[]');
    const nomesExistentes = new Set(listaAtual.map(a => a.nome));
    const unicos = novos.filter(n => !nomesExistentes.has(n.nome));
    const listaFinal = [...listaAtual, ...unicos];
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaFinal));
    setArquivos(listaFinal); 
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- EXPORTAR PARA EXCEL ---
  const exportExcel = () => {
    const dados = items.map(it => ({
      CODIGO: it.codigo,
      REQUISITO: it.descricao_de_condicionante,
      STATUS: isValido(it.codigo) ? 'CONFORMIDADE' : 'PENDENTE'
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
    XLSX.writeFile(wb, `Maximus_Auditoria_${projeto}.xlsx`);
  };

  const isValido = (cod) => arquivos.some(a => a.nome.includes(String(cod).toUpperCase()));

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={50}/> AGUARDE...</div>;

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={s.brand}><Shield color="#0f0" size={35}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA</option>
          <option value="Posto">⛽ POSTO</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale size={22}/> AUDITORIA</button>
          <button onClick={()=>setAba('MAPA')} style={aba==='MAPA'?s.menuBtnA:s.menuBtn}><Globe size={22}/> MAPA DE RISCO (PA)</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.menuBtnA:s.menuBtn}><PenTool size={22}/> ASSINAR GOV.BR</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.menuBtnA:s.menuBtn}><BarChart3 size={22}/> DASHBOARD</button>
        </nav>

        <div style={s.monitor}>
          <div style={s.monHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={16} onClick={()=>{setArquivos([]); localStorage.removeItem(`MAX_FILES_${projeto}`)}} cursor="pointer"/></div>
          <div style={s.monList}>{arquivos.map(a => <div key={a.id} style={s.monItem}>✓ {a.nome}</div>)}</div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}><Search color="#444" size={24}/><input placeholder="FILTRAR..." style={s.input} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={exportExcel} style={s.btnEx}><FileText size={18}/> EXCEL</button>
             <button onClick={()=>alert('Gerando DOCX Editável...')} style={s.btnEx}><Download size={18}/> DOCX</button>
             <label style={s.btnUp}><FilePlus size={18}/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO LEGAL AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={isValido(it.codigo)?'#0f0':'#111'} size={38}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'MAPA' && (
            <div style={s.mapArea}>
              <h2 style={{color:'#0f0', marginBottom:20}}>MAPA DE CALOR - OPERAÇÕES PARÁ</h2>
              <div style={s.mapCanvas}>
                {/* REPRESENTAÇÃO DO MAPA DO PARÁ */}
                <div style={{...s.pin, top:'30%', left:'70%', background:'#f00'}} title="Barcarena: CRÍTICO"></div>
                <div style={{...s.pin, top:'70%', left:'60%', background:'#ff0'}} title="Parauapebas: ALERTA"></div>
                <div style={{...s.pin, top:'20%', left:'45%', background:'#0f0'}} title="Belém: OK"></div>
                <p style={{marginTop:250, color:'#333', fontSize:12}}>CONEXÃO COM SATÉLITE SEMAS/PA ATIVA</p>
              </div>
              <div style={s.mapLegend}>
                <div style={s.leg}><div style={{...s.cBox, background:'#f00'}}></div> ALTO RISCO</div>
                <div style={s.leg}><div style={{...s.cBox, background:'#ff0'}}></div> MÉDIO RISCO</div>
                <div style={s.leg}><div style={{...s.cBox, background:'#0f0'}}></div> CONFORMIDADE</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0' },
  sidebar: { width: '380px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 28, fontWeight: 900, marginBottom: 40, display: 'flex', gap: 10, alignItems: 'center' },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '18px', borderRadius: 12, marginBottom: 30, fontSize: 16, outline: 'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 8 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '18px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 12, padding: '18px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  monitor: { flex: 1, marginTop: 30, background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  monHead: { padding: '12px 20px', fontSize: 12, fontWeight: 'bold', background: '#080808', color: '#222', display: 'flex', justifyContent: 'space-between' },
  monList: { padding: 20, overflowY: 'auto', flex: 1, fontSize: 11, color: '#0f0' },
  monItem: { marginBottom: 6, opacity: 0.7 },
  main: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 30, gap: 20 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 20, display: 'flex', alignItems: 'center', padding: '0 25px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '20px', width: '100%', outline: 'none', fontSize: 18 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  btnEx: { background: '#111', color: '#fff', border:'1px solid #222', padding: '12px 20px', borderRadius: 15, fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '25px', fontSize: 12, color: '#333', background: '#030303', position: 'sticky', top: 0, zIndex: 5 },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '30px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '30px', color: '#ccc', fontSize: 20, lineHeight: 1.5, fontWeight: '500' },
  mapArea: { padding: 50, textAlign:'center' },
  mapCanvas: { width: '100%', maxWidth: '600px', height: '350px', background: '#080808', margin: '0 auto', borderRadius: 30, position: 'relative', border: '1px solid #111' },
  pin: { position: 'absolute', width: 15, height: 15, borderRadius: '50%', boxShadow: '0 0 15px currentColor' },
  mapLegend: { display:'flex', justifyContent:'center', gap:30, marginTop:30 },
  leg: { display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#444' },
  cBox: { width: 12, height: 12, borderRadius: 2 }
};
