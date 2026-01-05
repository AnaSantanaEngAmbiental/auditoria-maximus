import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, AlertCircle, Zap, Map as MapIcon, ChevronRight, Activity, Download
} from 'lucide-react';

// Configuração Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV55() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- 1. CARREGAMENTO E VARREDURA DE CACHE ---
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregar() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      // Carrega arquivos específicos do projeto. Se não houver, inicia com []
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      
      const savedLogs = localStorage.getItem(`MAX_LOGS_${projeto}`);
      setLogs(savedLogs ? JSON.parse(savedLogs) : []);
      
      setLoading(false);
    }
    carregar();
  }, [projeto]);

  // --- 2. REGISTRO DE LOGS ---
  const registrarAcao = (texto) => {
    const novoLog = { id: Date.now(), acao: texto, hora: new Date().toLocaleTimeString('pt-BR') };
    const listaLogs = [novoLog, ...logs].slice(0, 20);
    setLogs(listaLogs);
    localStorage.setItem(`MAX_LOGS_${projeto}`, JSON.stringify(listaLogs));
  };

  // --- 3. MOTOR DE UPLOAD (SEM DUPLICIDADE E ATUALIZAÇÃO IMEDIATA) ---
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const novos = files.map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleDateString('pt-BR'),
      id: `${f.name}-${Date.now()}`
    }));

    setArquivos(prev => {
      const nomes = new Set(prev.map(a => a.nome));
      const unicos = novos.filter(n => !nomes.has(n.nome));
      
      if (unicos.length > 0) {
        const resultado = [...prev, ...unicos];
        localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(resultado));
        registrarAcao(`Adicionado ${unicos.length} documento(s)`);
        return resultado;
      }
      return prev;
    });

    // Reset do input para permitir re-upload do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 4. RESET TOTAL DO PROJETO (LIMPA TUDO) ---
  const resetGeral = () => {
    if (window.confirm("Deseja LIMPAR todos os dados deste projeto?")) {
      setArquivos([]);
      setLogs([]);
      localStorage.removeItem(`MAX_FILES_${projeto}`);
      localStorage.removeItem(`MAX_LOGS_${projeto}`);
      registrarAcao("SISTEMA REINICIADO / LIMPO");
    }
  };

  const isValido = (cod) => arquivos.some(a => a.nome.includes(String(cod).toUpperCase()));

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={48}/></div>;

  return (
    <div style={s.container}>
      {/* SIDEBAR DESIGN v53 */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <Shield color="#0f0" size={32}/>
          <div style={s.brandText}>MAXIMUS <span style={s.phd}>PhD</span> <span style={s.version}>v55</span></div>
        </div>

        <div style={s.sectionTitle}>EMPREENDIMENTO</div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO (PARAUAPEBAS)</option>
          <option value="Logistica">🚚 LOGÍSTICA (BARCARENA)</option>
          <option value="Posto">⛽ POSTO COMBUSTÍVEL (BELÉM)</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale size={20}/> AUDITORIA TÉCNICA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.menuBtnA:s.menuBtn}><Truck size={20}/> FROTA / CIPP / CIV</button>
          <button onClick={()=>setAba('MAPA')} style={aba==='MAPA'?s.menuBtnA:s.menuBtn}><MapIcon size={20}/> MAPA DE RISCO</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.menuBtnA:s.menuBtn}><BarChart3 size={20}/> DASHBOARD KPI</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.menuBtnA:s.menuBtn}><PenTool size={20}/> GOV.BR / ASSINA</button>
        </nav>

        {/* LOG DE ATIVIDADES FLUTUANTE (DESIGN DA IMAGEM) */}
        <div style={s.logBox}>
          <div style={s.logHeader}>
            LOG DE ATIVIDADES 
            <Trash2 size={16} onClick={resetGeral} style={{cursor:'pointer', color:'#f00'}}/>
          </div>
          <div style={s.logContent}>
            {logs.length === 0 ? <p style={{color:'#333', fontSize:12}}>Aguardando ações...</p> : 
              logs.map(l => <div key={l.id} style={s.logItem}>• {l.hora}: {l.acao}</div>)
            }
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}>
            <Search color="#444" size={24}/>
            <input 
              placeholder="Pesquisar requisito, lei ou código..." 
              style={s.searchInput}
              value={busca}
              onChange={e=>setBusca(e.target.value)}
            />
          </div>
          <div style={{display:'flex', gap:15}}>
             <button onClick={()=>alert('Gerando PDF...')} style={s.btnExport}><Download size={20}/> RELATÓRIO</button>
             <label style={s.btnUpload}>
               <FilePlus size={20}/> ADICIONAR DOCS
               <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/>
             </label>
          </div>
        </header>

        <div style={s.contentArea}>
          {aba === 'AUDITORIA' && (
            <div style={s.tableScroll}>
              <table style={s.table}>
                <thead>
                  <tr style={s.tableHeader}>
                    <th style={{width:80}}>CÓD</th>
                    <th>REQUISITO LEGAL AMBIENTAL</th>
                    <th style={{textAlign:'center', width:100}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tableRow}>
                      <td style={s.tdCodigo}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        <Camera color={isValido(it.codigo)?'#0f0':'#1a1a1a'} size={32} style={{transition:'0.3s'}}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={s.paddingArea}>
              <h2 style={{color:'#0f0', marginBottom:30, fontSize:28}}>Controle de Frota Logística</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT', 'CRLV'].map(cert => (
                <div key={cert} style={s.frotaCard}>
                  <div style={{display:'flex', alignItems:'center', gap:20}}>
                    <Truck color={isValido(cert)?'#0f0':'#333'} size={30}/>
                    <span style={{fontSize:20, fontWeight:'bold'}}>{cert} - Certificado de Conformidade</span>
                  </div>
                  <div style={{color: isValido(cert)?'#0f0':'#f00', fontWeight:'bold', fontSize:18}}>
                    {isValido(cert) ? 'VALIDADO ✓' : 'PENDENTE X'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {aba === 'GOV' && (
            <div style={s.centerView}>
              <div style={s.govPanel}>
                <Shield color="#0f0" size={80}/>
                <h1 style={{fontSize:32, margin:'20px 0'}}>Assinador Digital Gov.br</h1>
                <p style={{color:'#666', marginBottom:40}}>Autentique-se para dar validade jurídica aos relatórios.</p>
                <button onClick={()=>setAssinando(!assinando)} style={s.govBtn}>
                  {assinando ? "IDENTIDADE PRATA CONECTADA" : "ENTRAR COM GOV.BR"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ESTILIZAÇÃO v55 (Design de Alto Impacto)
const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // SIDEBAR
  sidebar: { width: '400px', background: '#080808', borderRight: '1px solid #111', padding: '40px', display: 'flex', flexDirection: 'column' },
  brand: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 50 },
  brandText: { fontSize: 26, fontWeight: 900, letterSpacing: -1 },
  phd: { color: '#0f0' },
  version: { fontSize: 10, background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: 4, verticalAlign: 'middle' },
  sectionTitle: { fontSize: 11, color: '#333', fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '18px', borderRadius: 15, marginBottom: 40, fontSize: 15, outline: 'none', cursor: 'pointer' },
  menu: { display: 'flex', flexDirection: 'column', gap: 10 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 15, padding: '20px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left', borderRadius: 15, fontSize: 17, fontWeight: 700, transition: '0.2s' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 15, padding: '20px', background: '#111', border: '1px solid #0f0', color: '#0f0', borderRadius: 15, fontSize: 17, fontWeight: 700 },
  
  // LOG BOX (Como na imagem)
  logBox: { flex: 1, marginTop: 40, background: '#050505', borderRadius: 25, border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  logHeader: { padding: '15px 20px', fontSize: 12, fontWeight: 'bold', background: '#0a0a0a', color: '#444', display: 'flex', justifyContent: 'space-between' },
  logContent: { padding: 20, overflowY: 'auto', flex: 1 },
  logItem: { fontSize: 11, color: '#0f0', marginBottom: 8, opacity: 0.6, borderBottom: '1px solid #0a0a0a', paddingBottom: 4 },

  // MAIN CONTENT
  main: { flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', background: '#000' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 40, gap: 20 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 25, display: 'flex', alignItems: 'center', padding: '0 30px' },
  searchInput: { background: 'none', border: 'none', color: '#fff', padding: '22px', width: '100%', outline: 'none', fontSize: 18 },
  btnUpload: { background: '#0f0', color: '#000', padding: '15px 35px', borderRadius: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', gap: 12, alignItems:'center', fontSize: 15 },
  btnExport: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px 30px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 12, alignItems:'center', fontSize: 15 },
  
  contentArea: { background: '#050505', borderRadius: 40, border: '1px solid #111', flex: 1, overflow: 'hidden' },
  tableScroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { textAlign: 'left', background: '#050505', position: 'sticky', top: 0, zIndex: 10 },
  tableRow: { borderBottom: '1px solid #0a0a0a', transition: '0.2s' },
  th: { padding: '30px', fontSize: 12, color: '#333', borderBottom: '1px solid #111' },
  tdCodigo: { padding: '30px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '30px', color: '#ccc', fontSize: 19, lineHeight: 1.6 },

  // TELAS ADICIONAIS
  paddingArea: { padding: 60 },
  frotaCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 30, background: '#0a0a0a', borderRadius: 20, marginBottom: 15, border: '1px solid #111' },
  centerView: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  govPanel: { textAlign: 'center', background: '#080808', padding: 80, borderRadius: 40, border: '1px solid #111', maxWidth: 600 },
  govBtn: { background: '#fff', color: '#000', border: 'none', padding: '22px 50px', borderRadius: 15, fontWeight: 900, fontSize: 18, cursor: 'pointer', marginTop: 30 }
};
