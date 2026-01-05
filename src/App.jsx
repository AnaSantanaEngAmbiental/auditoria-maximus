import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, FileSearch, HardHat, 
  Truck, Calendar, ClipboardCheck, RefreshCw, FileText, ChevronRight
} from 'lucide-react';

// Configuração do Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  const projetoInfo = { 
    empresa: "Cardoso & Rates Engenharia", 
    processo: "2023/12345-SEMMA", 
    tecnico: "Philipe Santana" 
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('base_condicionantes').select('*').range(0, 500);
      if (data) {
        const formatted = data.map(i => ({ 
          ...i, 
          textoLimpo: (i['descricao de condicionante'] || '').replace(/["]/g, ''),
          categoria: determinarCategoria(i.codigo) 
        }));
        setItems(formatted);
        const initialStatus = {};
        formatted.forEach(i => initialStatus[i.codigo] = "PENDENTE");
        setStatusMap(initialStatus);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const determinarCategoria = (codigo) => {
    if (codigo <= 10) return 'BASICA';
    if (codigo <= 30) return 'TECNICA';
    if (codigo <= 50) return 'PROJETO';
    return 'DIRETRIZ';
  };

  const filtrados = useMemo(() => {
    return items.filter(i => {
      const matchBusca = i.textoLimpo.toLowerCase().includes(busca.toLowerCase());
      const matchCat = filtroCategoria === 'TODOS' || i.categoria === filtroCategoria;
      return matchBusca && matchCat;
    });
  }, [items, busca, filtroCategoria]);

  if (!mounted) return <div style={{background:'#000', height:'100vh'}} />;

  return (
    <div style={s.app}>
      {/* SIDEBAR CONSOLIDADA */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS PhD</div>
        
        <div style={s.label}>EMPRESA</div>
        <select style={s.selectEmpresa}>
          <option>{projetoInfo.empresa}</option>
        </select>

        <div style={s.label}>CATEGORIAS</div>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
          <button 
            key={cat}
            onClick={() => {setFiltroCategoria(cat); setAbaAtiva('AUDITORIA');}} 
            style={filtroCategoria === cat && abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}
          >
            <ChevronRight size={14} /> {cat}
          </button>
        ))}

        <div style={s.label}>SISTEMA</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}><LayoutDashboard size={18}/> Dashboard</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabBtnActive : s.tabBtn}><Truck size={18}/> Frota & Logística</button>
        
        <div style={{marginTop: '20px'}}>
          <button onClick={() => window.print()} style={s.procuracaoBtn}><FileText size={18}/> Gerar Procuração</button>
          <button onClick={fetchData} style={s.syncBtn}><RefreshCw size={14}/> Sincronizar Base</button>
        </div>

        <div style={s.sidebarFooter}>
           <div style={s.userBox}>
             <div style={s.avatar}>P</div>
             <div><div style={{fontSize:12, fontWeight:'bold'}}>{projetoInfo.tecnico}</div><div style={{fontSize:10, color:'#444'}}>Eng. Ambiental</div></div>
           </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={20} color="#333"/>
            <input style={s.input} placeholder="Pesquisar na base de dados..." onChange={(e) => setBusca(e.target.value)} />
          </div>
          <button onClick={() => window.print()} style={s.pdfBtn}><Printer size={16}/> PDF TELA</button>
        </header>

        {loading ? <div style={s.loader}>Sincronizando com Supabase...</div> : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><CheckCircle2 color="#25d366" size={30}/><h3>{items.length}</h3><p>Condicionantes na Base</p></div>
                <div style={s.card}><HardHat color="#25d366" size={30}/><h3>100%</h3><p>Conformidade Técnica</p></div>
                <div style={s.card}><AlertCircle color="#ff4444" size={30}/><h3>02</h3><p>Prazos em Alerta</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <div style={s.tableHeader}>
                  <span>📋 <b>{filtroCategoria}</b> - {projetoInfo.empresa}</span>
                  <span>{projetoInfo.processo} <span style={{color:'#25d366'}}>● Online</span></span>
                </div>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>CÓD</th><th style={s.th}>REQUISITO TÉCNICO</th><th style={s.th}>STATUS</th></tr></thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.textoLimpo}</td>
                        <td style={s.tdAction}>
                          <select 
                            style={{...s.selectStatus, color: statusMap[item.codigo] === 'CONCLUÍDO' ? '#25d366' : '#ff4444'}} 
                            value={statusMap[item.codigo]} 
                            onChange={(e) => setStatusMap({...statusMap, [item.codigo]: e.target.value})}
                          >
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="CONCLUÍDO">CONCLUÍDO</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.grid}>
                <div style={s.card}><ClipboardCheck color="#25d366" size={40}/><h4>Certificado CIPP</h4><p>Vencimento: 15/05/2026</p><span style={s.tagVerde}>REGULAR</span></div>
                <div style={s.card}><Calendar color="#ff4444" size={40}/><h4>Curso MOPP</h4><p>João Silva - Vencendo</p><span style={s.tagVermelha}>ALERTA</span></div>
                <div style={s.card}><Truck color="#25d366" size={40}/><h4>Licença Ambiental</h4><p>Transporte de Resíduos</p><span style={s.tagVerde}>ATIVO</span></div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#050505', padding: '20px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1px' },
  selectEmpresa: { background: '#0a0a0a', color: '#ccc', border: '1px solid #222', padding: '8px', borderRadius: '5px', width: '100%', fontSize: '12px', marginBottom: '10px' },
  tabBtn: { width: '100%', padding: '10px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', fontSize: '13px' },
  tabBtnActive: { width: '100%', padding: '10px', background: '#0a0a0a', border: 'none', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', borderRadius: '8px', fontSize: '13px' },
  procuracaoBtn: { width: '100%', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' },
  syncBtn: { width: '100%', background: 'none', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px' },
  sidebarFooter: { marginTop: 'auto' },
  userBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#0a0a0a', borderRadius: '12px' },
  avatar: { width: 30, height: 30, background: '#25d366', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', gap: '20px' },
  searchBox: { background: '#050505', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', flex: 1, border: '1px solid #111' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#fff', color: '#000', padding: '0 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#050505', padding: '30px', borderRadius: '15px', border: '1px solid #111', textAlign: 'center' },
  tableContainer: { background: '#050505', borderRadius: '15px', border: '1px solid #111' },
  tableHeader: { padding: '15px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#25d366', fontSize: '11px', borderBottom: '1px solid #111', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #080808', transition: '0.3s' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold', fontSize: '14px' },
  tdDesc: { padding: '15px', color: '#bbb', fontSize: '12px', lineHeight: '1.6' },
  tdAction: { padding: '15px' },
  selectStatus: { background: '#000', border: '1px solid #222', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' },
  tagVerde: { fontSize: '10px', background: '#0a2212', color: '#25d366', padding: '5px 10px', borderRadius: '5px', marginTop: '15px', display: 'inline-block' },
  tagVermelha: { fontSize: '10px', background: '#2a0a0a', color: '#ff4444', padding: '5px 10px', borderRadius: '5px', marginTop: '15px', display: 'inline-block' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366', fontSize: '14px', letterSpacing: '2px' }
};
