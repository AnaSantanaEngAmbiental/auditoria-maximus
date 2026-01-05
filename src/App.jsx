import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, RotateCcw, FileSearch, HardHat, 
  ChevronRight, ArrowRight
} from 'lucide-react';

// Conexão Segura
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
  const [loading, setLoading] = useState(true);

  const projetoInfo = {
    empresa: "Cardoso & Rates Engenharia",
    processo: "2023/12345-SEMMA",
    tecnico: "Philipe Santana"
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 300);
        if (data) {
          const formatted = data.map(i => ({
            ...i,
            textoLimpo: (i['descricao de condicionante'] || '').replace(/["]/g, '')
          }));
          setItems(formatted);
          const initialStatus = {};
          formatted.forEach(i => initialStatus[i.codigo] = "PENDENTE");
          setStatusMap(initialStatus);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleStatusChange = (id, val) => {
    setStatusMap(prev => ({ ...prev, [id]: val }));
  };

  const filtrados = useMemo(() => 
    items.filter(i => i.textoLimpo.toLowerCase().includes(busca.toLowerCase())), 
  [items, busca]);

  if (!mounted) return <div style={{background:'#000', height:'100vh'}} />;

  return (
    <div style={s.app}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS</div>
        
        <div style={s.label}>CONTROLE TÉCNICO</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}>
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}>
          <FileSearch size={18}/> Auditoria Técnica
        </button>

        <div style={s.sidebarFooter}>
           <div style={s.userBox}>
             <div style={s.avatar}>{projetoInfo.tecnico[0]}</div>
             <div>
               <div style={{fontSize:12, fontWeight:'bold'}}>{projetoInfo.tecnico}</div>
               <div style={{fontSize:10, color:'#444'}}>Eng. Ambiental</div>
             </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={20} color="#333"/>
            <input 
              style={s.input} 
              placeholder="Pesquisar exigências..." 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <button onClick={() => window.print()} style={s.pdfBtn}>
            <Printer size={16}/> IMPRIMIR LAUDO
          </button>
        </header>

        {loading ? (
          <div style={s.loader}>Sincronizando...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}>
                   <div style={s.cardIcon}><CheckCircle2 color="#25d366"/></div>
                   <h3>{items.length}</h3>
                   <p>Condicionantes na Base</p>
                </div>
                <div style={s.card}>
                   <div style={s.cardIcon}><HardHat color="#25d366"/></div>
                   <h3>100%</h3>
                   <p>Conformidade Técnica</p>
                </div>
                <div style={s.card}>
                   <div style={s.cardIcon}><AlertCircle color="#ff4444"/></div>
                   <h3>02</h3>
                   <p>Prazos em Alerta</p>
                </div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <div style={s.tableHeader}>
                    <span>📌 <b>{projetoInfo.empresa}</b></span>
                    <span>Processo: {projetoInfo.processo}</span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>ID</th>
                      <th style={s.th}>DESCRIÇÃO DA EXIGÊNCIA</th>
                      <th style={s.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.textoLimpo}</td>
                        <td style={s.tdAction}>
                          <select 
                            style={{...s.select, color: statusMap[item.codigo] === 'CONCLUÍDO' ? '#25d366' : '#ff4444'}}
                            value={statusMap[item.codigo]}
                            onChange={(e) => handleStatusChange(item.codigo, e.target.value)}
                          >
                            <option value="PENDENTE">🔴 PENDENTE</option>
                            <option value="CONCLUÍDO">🟢 CONCLUÍDO</option>
                          </select>
                        </td>
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
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '250px', backgroundColor: '#050505', padding: '20px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' },
  label: { fontSize: '10px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' },
  tabBtnActive: { width: '100%', padding: '12px', background: '#0a0a0a', border: 'none', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', borderRadius: '8px' },
  sidebarFooter: { marginTop: 'auto' },
  userBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#0a0a0a', borderRadius: '12px' },
  avatar: { width: 32, height: 32, background: '#25d366', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  searchBox: { background: '#050505', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', width: '60%', border: '1px solid #111' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '10px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#fff', color: '#000', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#050505', padding: '25px', borderRadius: '15px', border: '1px solid #111', textAlign: 'center' },
  cardIcon: { marginBottom: '10px', display: 'flex', justifyContent: 'center' },
  tableContainer: { background: '#050505', borderRadius: '15px', border: '1px solid #111' },
  tableHeader: { padding: '15px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#25d366', fontSize: '11px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold', fontSize: '13px' },
  tdDesc: { padding: '15px', color: '#999', fontSize: '12px', lineHeight: '1.5' },
  tdAction: { padding: '15px' },
  select: { background: '#000', border: '1px solid #111', padding: '6px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366' }
};
