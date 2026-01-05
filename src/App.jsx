import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, Map as MapIcon, Download
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV56() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO ROBUSTO (LETRA SEMPRE APARECE)
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregar() {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (data) setItems(data);
      } catch (e) { console.error("Erro banco:", e); }
      
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      setLoading(false);
    }
    carregar();
  }, [projeto]);

  // 2. UPLOAD COM ATUALIZAÇÃO FORÇADA
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const novos = files.map(f => ({
      nome: f.name.toUpperCase(),
      id: `${f.name}-${Date.now()}`
    }));

    const listaAtual = JSON.parse(localStorage.getItem(`MAX_FILES_${projeto}`) || '[]');
    const nomesExistentes = new Set(listaAtual.map(a => a.nome));
    const unicos = novos.filter(n => !nomesExistentes.has(n.nome));
    
    const listaFinal = [...listaAtual, ...unicos];
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaFinal));
    setArquivos(listaFinal); // Atualiza estado na hora

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isValido = (cod) => arquivos.some(a => a.nome.includes(String(cod).toUpperCase()));

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={48}/> CARREGANDO SISTEMA...</div>;

  return (
    <div style={s.container}>
      {/* SIDEBAR - DESIGN V53 APROVADO */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <Shield color="#0f0" size={35}/>
          <div style={s.brandText}>MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        </div>

        <div style={s.label}>EMPREENDIMENTO ATIVO</div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA</option>
          <option value="Posto">⛽ POSTO COMBUSTÍVEL</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.menuBtnA:s.menuBtn}><Truck/> FROTA / CIPP</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.menuBtnA:s.menuBtn}><PenTool/> ASSINAR</button>
        </nav>

        <div style={s.fileBox}>
          <div style={s.fileHeader}>DOCUMENTOS ({arquivos.length}) <Trash2 size={16} onClick={()=>{localStorage.removeItem(`MAX_FILES_${projeto}`); setArquivos([])}} cursor="pointer"/></div>
          <div style={s.fileList}>
            {arquivos.map(a => <div key={a.id} style={s.fileItem}>✓ {a.nome}</div>)}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}>
            <Search color="#555" size={24}/>
            <input placeholder="PESQUISAR..." style={s.searchInput} onChange={e=>setBusca(e.target.value)}/>
          </div>
          <label style={s.btnUpload}>
            <FilePlus/> ADICIONAR DOCUMENTOS
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/>
          </label>
        </header>

        <div style={s.contentArea}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thRow}>
                    <th style={{width:100}}>CÓD</th>
                    <th>REQUISITO AMBIENTAL</th>
                    <th style={{textAlign:'center', width:120}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        <Camera color={isValido(it.codigo)?'#0f0':'#1a1a1a'} size={35}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:50}}>
              <h1 style={{color:'#0f0', fontSize:35, marginBottom:40}}>Controle de Certificados</h1>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(cert => (
                <div key={cert} style={s.frotaCard}>
                  <span style={{fontSize:24, fontWeight:900}}>{cert}</span>
                  <span style={{color: isValido(cert)?'#0f0':'#f00', fontWeight:900, fontSize:20}}>
                    {isValido(cert) ? 'VALIDADO ✓' : 'PENDENTE X'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontSize: 20 },
  sidebar: { width: '400px', background: '#080808', borderRight: '1px solid #111', padding: '40px', display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 50 },
  brandText: { fontSize: 30, fontWeight: 900 },
  label: { fontSize: 12, color: '#444', marginBottom: 10, fontWeight: 'bold' },
  select: { background: '#111', color: '#fff', border: '1px solid #333', padding: '20px', borderRadius: 15, marginBottom: 40, fontSize: 16, outline: 'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 10 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 15, padding: '22px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: 15, fontSize: 18, fontWeight: 'bold' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 15, padding: '22px', background: '#111', border: '1px solid #0f0', color: '#0f0', borderRadius: 15, fontSize: 18, fontWeight: 'bold' },
  fileBox: { flex: 1, marginTop: 40, background: '#040404', borderRadius: 25, border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  fileHeader: { padding: '15px 20px', fontSize: 13, fontWeight: 'bold', background: '#0a0a0a', color: '#333', display: 'flex', justifyContent: 'space-between' },
  fileList: { padding: 20, overflowY: 'auto', flex: 1, fontSize: 12, color: '#0f0' },
  fileItem: { marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  main: { flex: 1, padding: '50px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 40, gap: 25 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 25, display: 'flex', alignItems: 'center', padding: '0 30px' },
  searchInput: { background: 'none', border: 'none', color: '#fff', padding: '25px', width: '100%', outline: 'none', fontSize: 20 },
  btnUpload: { background: '#0f0', color: '#000', padding: '15px 35px', borderRadius: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', gap: 15, alignItems:'center', fontSize: 16 },
  contentArea: { background: '#050505', borderRadius: 45, border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', background: '#050505', position: 'sticky', top: 0, zIndex: 10 },
  tr: { borderBottom: '1px solid #0a0a0a' },
  tdCod: { padding: '35px', color: '#0f0', fontWeight: 'bold', fontSize: 24 },
  tdDesc: { padding: '35px', color: '#fff', fontSize: 20, lineHeight: 1.6, fontWeight: '500' },
  frotaCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 40, background: '#080808', borderRadius: 25, marginBottom: 20, border: '1px solid #111' }
};
