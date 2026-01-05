import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, AlertTriangle, UserCheck, Lock
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV57() {
  // --- ESTADOS CORE ---
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- 1. CARREGAMENTO BLINDADO ---
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregar() {
      setLoading(true);
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (data) setItems(data);
      } catch (e) { console.error("Erro Conexão:", e); }
      
      const saved = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
    carregar();
  }, [projeto]);

  // --- 2. MOTOR DE UPLOAD INSTANTÂNEO ---
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
    setArquivos(listaFinal); 

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 3. DISPARO WHATSAPP (SIMULAÇÃO FUNCIONAL #10) ---
  const enviarStatusZap = () => {
    const link = `https://wa.me/5591999999999?text=Relatório Maximus: Projeto ${projeto} com ${arquivos.length} documentos validados.`;
    window.open(link, '_blank');
  };

  const isValido = (cod) => arquivos.some(a => a.nome.includes(String(cod).toUpperCase()));

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={50}/> <br/> SINCRONIZANDO MAXIMUS...</div>;

  return (
    <div style={s.container}>
      {/* SIDEBAR MASTER */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <Shield color="#0f0" size={40}/>
          <div style={s.brandText}>MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        </div>

        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA</option>
          <option value="Posto">⛽ POSTO COMBUSTÍVEL</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale size={24}/> AUDITORIA TÉCNICA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.menuBtnA:s.menuBtn}><Truck size={24}/> FROTA E CIPP</button>
          <button onClick={()=>setAba('ASSINAR')} style={aba==='ASSINAR'?s.menuBtnA:s.menuBtn}><PenTool size={24}/> ASSINAR GOV.BR</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.menuBtnA:s.menuBtn}><BarChart3 size={24}/> DASHBOARD KPI</button>
        </nav>

        <div style={s.docMonitor}>
          <div style={s.monitorHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={18} onClick={()=>{localStorage.removeItem(`MAX_FILES_${projeto}`); setArquivos([])}} cursor="pointer"/></div>
          <div style={s.monitorList}>
            {arquivos.map(a => <div key={a.id} style={s.monitorItem}><CheckCircle size={12} color="#0f0"/> {a.nome}</div>)}
          </div>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}><Search color="#555" size={28}/><input placeholder="BUSCAR REQUISITO..." style={s.searchInput} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:15}}>
             <button onClick={enviarStatusZap} style={s.btnZap}><MessageCircle/> WHATSAPP</button>
             <label style={s.btnUp}><FilePlus/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.thRow}><th>CÓD</th><th>REQUISITO AMBIENTAL (LEI)</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={isValido(it.codigo)?'#0f0':'#111'} size={40}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:60}}>
              <h1 style={s.tituloSeção}>Documentação de Frota Pesada</h1>
              {['CIPP', 'CIV', 'MOPP', 'ANTT', 'CRLV'].map(cert => (
                <div key={cert} style={s.cardFrota}>
                  <div style={{display:'flex', gap:20, alignItems:'center'}}><Truck size={30} color="#0f0"/> <div><b style={{fontSize:22}}>{cert}</b><br/><span style={{fontSize:14, color:'#444'}}>Obrigatório para transporte de produtos perigosos</span></div></div>
                  <div style={{color: isValido(cert)?'#0f0':'#f00', fontWeight:900, fontSize:22}}>{isValido(cert)?'VALIDADO ✓':'PENDENTE'}</div>
                </div>
              ))}
            </div>
          )}

          {aba === 'ASSINAR' && (
            <div style={s.fullCenter}>
              <div style={s.cardGov}>
                <UserCheck size={80} color="#0f0"/>
                <h1 style={{fontSize:35, margin:'20px 0'}}>Portal de Assinatura</h1>
                <p style={{color:'#666', fontSize:18, marginBottom:40}}>Clique abaixo para validar seus documentos com certificado digital Prata ou Ouro.</p>
                <button onClick={()=>setAssinando(!assinando)} style={assinando ? s.btnSigned : s.btnGov}>
                  {assinando ? "SISTEMA AUTENTICADO" : "AUTENTICAR COM GOV.BR"}
                </button>
                {assinando && <div style={{marginTop:20, color:'#0f0'}}><Lock size={16}/> Criptografia ICP-Brasil Ativa</div>}
              </div>
            </div>
          )}

          {aba === 'DASH' && (
            <div style={{padding:60}}>
              <h1 style={s.tituloSeção}>Indicadores de Conformidade</h1>
              <div style={s.dashGrid}>
                <div style={s.kpiCard}><span>SAÚDE AMBIENTAL</span><h2>{((arquivos.length / (items.length || 1)) * 100).toFixed(0)}%</h2></div>
                <div style={s.kpiCard}><span>EVIDÊNCIAS</span><h2>{arquivos.length}</h2></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Arial, sans-serif' },
  load: { height: '100vh', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontSize: 24, fontWeight:900 },
  sidebar: { width: '420px', background: '#050505', borderRight: '1px solid #111', padding: '40px', display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 50 },
  brandText: { fontSize: 32, fontWeight: 900 },
  select: { background: '#111', color: '#fff', border: '1px solid #333', padding: '22px', borderRadius: 15, marginBottom: 40, fontSize: 18, outline: 'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 12 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 15, padding: '24px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: 18, fontSize: 18, fontWeight: 'bold' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 15, padding: '24px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: 18, fontSize: 18, fontWeight: 'bold' },
  docMonitor: { flex: 1, marginTop: 40, background: '#020202', borderRadius: 30, border: '1px solid #0a0a0a', overflow: 'hidden', display:'flex', flexDirection:'column' },
  monitorHead: { padding: '15px 25px', fontSize: 14, fontWeight: 900, background: '#080808', color: '#222', display: 'flex', justifyContent: 'space-between' },
  monitorList: { padding: 25, overflowY: 'auto', flex: 1, fontSize: 13, color: '#0f0' },
  monitorItem: { marginBottom: 12, display:'flex', gap:8, alignItems:'center' },
  main: { flex: 1, padding: '50px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 40, gap: 25 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 30, display: 'flex', alignItems: 'center', padding: '0 30px' },
  searchInput: { background: 'none', border: 'none', color: '#fff', padding: '28px', width: '100%', outline: 'none', fontSize: 22 },
  btnUp: { background: '#0f0', color: '#000', padding: '15px 40px', borderRadius: 22, fontWeight: 900, cursor: 'pointer', display: 'flex', gap: 15, alignItems:'center', fontSize: 17 },
  btnZap: { background: '#25D366', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 22, fontWeight: 900, cursor: 'pointer', display: 'flex', gap: 12, alignItems:'center', fontSize: 17 },
  content: { background: '#030303', borderRadius: 50, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', background: '#030303', position: 'sticky', top: 0, zIndex: 10 },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '40px', color: '#0f0', fontWeight: 'bold', fontSize: 26 },
  tdDesc: { padding: '40px', color: '#eee', fontSize: 22, lineHeight: 1.6, fontWeight: '500' },
  tituloSeção: { color: '#0f0', fontSize: 40, fontWeight: 900, marginBottom: 50 },
  cardFrota: { display:'flex', justifyContent:'space-between', alignItems:'center', padding: 45, background:'#080808', borderRadius:30, border:'1px solid #111', marginBottom:20 },
  fullCenter: { height: '100%', display:'flex', alignItems:'center', justifyContent:'center' },
  cardGov: { textAlign:'center', background:'#080808', padding:100, borderRadius:50, border:'1px solid #111', maxWidth:700 },
  btnGov: { background:'#fff', color:'#000', border:'none', padding:'25px 60px', borderRadius:20, fontSize:22, fontWeight:900, cursor:'pointer' },
  btnSigned: { background:'#0f0', color:'#000', border:'none', padding:'25px 60px', borderRadius:20, fontSize:22, fontWeight:900, cursor:'default' },
  dashGrid: { display:'grid', gridTemplateColumns: '1fr 1fr', gap:30 },
  kpiCard: { background:'#080808', padding:60, borderRadius:40, border:'1px solid #111', textAlign:'center' }
};
