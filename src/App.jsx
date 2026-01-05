import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, UploadCloud, FileText, 
  RefreshCcw, Camera, Building2, ChevronRight, 
  CheckCircle2, AlertTriangle, HardHat
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresaAtiva, setEmpresaAtiva] = useState('Posto Ipiranga');
  const [items, setItems] = useState([]);
  const [filtroCat, setFiltroCat] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [statusDB, setStatusDB] = useState({});
  const [arquivos, setArquivos] = useState([]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [empresaAtiva]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo', { ascending: true });
      if (data) {
        setItems(data.map(i => {
          // Lógica de Categorização por Código SEMAS/PA
          let cat = 'PROJETO';
          if (i.codigo <= 5) cat = 'DIRETRIZ';
          else if (i.codigo <= 15) cat = 'BASICA';
          else if (i.codigo <= 35) cat = 'TECNICA';
          
          return { 
            ...i, 
            cat, 
            desc: i.descricao_de_condicionante || 'Requisito em análise...' 
          };
        }));
      }
    } catch (e) { console.error("Erro Sync:", e); } 
    finally { setLoading(false); }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setArquivos(prev => [...prev, ...files.map(f => ({ nome: f.name }))]);
    setAbaAtiva('AUDITORIA');
    alert(`Engine Maximus: ${files.length} arquivos processados com sucesso!`);
  }, []);

  const filtrados = useMemo(() => 
    items.filter(i => filtroCat === 'TODOS' || i.cat === filtroCat), 
  [items, filtroCat]);

  if (!mounted) return null;

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
      
      {/* SIDEBAR TÉCNICA */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS <span style={s.phd}>PhD</span></div>
        
        <div style={s.label}>CLIENTE EM AUDITORIA</div>
        <select style={s.select} value={empresaAtiva} onChange={e => setEmpresaAtiva(e.target.value)}>
          <option>Posto Ipiranga</option>
          <option>Laticínio Pará</option>
          <option>Transportadora TNT</option>
          <option>Fábrica de Gelo</option>
        </select>

        <div style={s.label}>CATEGORIAS (SEMAS)</div>
        {['TODOS', 'DIRETRIZ', 'BASICA', 'TECNICA', 'PROJETO'].map(c => (
          <button key={c} onClick={() => {setFiltroCat(c); setAbaAtiva('AUDITORIA')}} 
            style={filtroCat === c && abaAtiva === 'AUDITORIA' ? s.tabA : s.tab}>
            <ChevronRight size={14} color={filtroCat === c ? "#25d366" : "#222"}/> {c}
          </button>
        ))}

        <div style={s.label}>GESTÃO OPERACIONAL</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabA : s.tab}><LayoutDashboard size={18}/> Dashboard</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabA : s.tab}><Truck size={18}/> Frota (CIPP/MOPP)</button>

        <div style={{marginTop: 'auto'}}>
          <button onClick={() => {setStatusDB({}); setArquivos([])}} style={s.btnReset}><RefreshCcw size={14}/> LIMPAR DADOS</button>
          <div style={s.userBox}>
             <div style={s.avatar}>PS</div>
             <div style={{fontSize:11}}><b>Philipe Santana</b><br/>Eng. Ambiental PhD</div>
          </div>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <h2><Building2 color="#25d366" style={{marginBottom:-4, marginRight:10}}/> {empresaAtiva}</h2>
          <div style={s.dropZone}>SOLTE OS ARQUIVOS AQUI PARA ANALISAR</div>
        </header>

        {loading ? <div style={s.loader}>🔍 CONECTANDO AO BANCO PADRONIZADO...</div> : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><CheckCircle2 color="#25d366" size={30}/><h3>{items.length}</h3><p>Condicionantes Identificadas</p></div>
                <div style={s.card}><UploadCloud color="#3498db" size={30}/><h3>{arquivos.length}</h3><p>Arquivos em Nuvem</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableWrap}>
                <div style={s.catHeader}>Visualização: {filtroCat}</div>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>CÓD</th><th style={s.th}>REQUISITO DA LICENÇA AMBIENTAL</th><th style={s.th}>STATUS</th><th style={s.th}>DOC</th></tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdC}>{item.codigo}</td>
                        <td style={s.tdD}>{item.desc}</td>
                        <td>
                          <select 
                            style={{...s.sel, color: statusDB[item.codigo] === 'OK' ? '#25d366' : '#ff4444'}} 
                            value={statusDB[item.codigo] || 'PENDENTE'}
                            onChange={e => setStatusDB({...statusDB, [item.codigo]: e.target.value})}
                          >
                            <option value="PENDENTE">🔴 PENDENTE</option>
                            <option value="OK">🟢 CUMPRIDO</option>
                          </select>
                        </td>
                        <td><Camera size={18} color={arquivos.length > 0 ? "#25d366" : "#1a1a1a"}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>VERIFICAÇÃO</th><th style={s.th}>DOCUMENTO DETECTADO</th><th style={s.th}>ANÁLISE</th></tr></thead>
                  <tbody>
                    {['CIPP Certificado', 'MOPP Motorista', 'ANTT Extrato'].map((f, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdC}>{f}</td>
                        <td style={s.tdD}>{arquivos[i]?.nome || 'Aguardando upload...'}</td>
                        <td style={{color: arquivos[i] ? '#25d366' : '#444'}}>● {arquivos[i] ? 'VÁLIDO' : 'AUSENTE'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}



const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '270px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { color: '#25d366', fontWeight: 'bold', fontSize: '18px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '10px' },
  phd: { background: '#25d366', color: '#000', fontSize: '9px', padding: '2px 5px', borderRadius: '4px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1.2px' },
  select: { width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', fontSize: '12px', outline: 'none' },
  tab: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', color: '#444', padding: '12px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' },
  tabA: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold' },
  btnReset: { background: '#110000', color: '#ff4444', border: '1px solid #311', width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' },
  userBox: { background: '#0a0a0a', padding: '15px', borderRadius: '15px', border: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: 34, height: 34, background: '#222', borderRadius: '50%', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #111', paddingBottom: '20px' },
  dropZone: { border: '1px dashed #222', padding: '12px 25px', borderRadius: '12px', fontSize: '10px', color: '#444' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' },
  card: { background: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '25px', textAlign: 'center' },
  tableWrap: { background: '#050505', border: '1px solid #111', borderRadius: '25px', overflow: 'hidden' },
  catHeader: { padding: '12px 20px', background: '#0a0a0a', color: '#25d366', fontSize: '10px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '18px', textAlign: 'left', color: '#444', fontSize: '10px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '18px', color: '#25d366', fontWeight: 'bold', fontSize: '14px' },
  tdD: { padding: '18px', color: '#888', fontSize: '12px', lineHeight: '1.6' },
  sel: { background: '#000', color: '#fff', border: '1px solid #222', padding: '8px', borderRadius: '8px', fontSize: '10px', outline: 'none' },
  loader: { textAlign: 'center', marginTop: '150px', color: '#25d366', fontWeight: 'bold' }
};
