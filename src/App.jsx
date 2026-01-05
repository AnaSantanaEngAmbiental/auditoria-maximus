import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, FileSearch, HardHat, 
  Truck, Calendar, ClipboardCheck, UploadCloud, MessageSquare, Mail, 
  GripVertical, BellRing, FileText, Settings, Droplets, Camera, Save, 
  TrendingUp, Clock, DollarSign
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [isReady, setIsReady] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ email: 'contato@cardosorates.com.br', zap: '5591988887777' });

  // Datas de exemplo para o cálculo de frota (Simulando banco de dados)
  const frotaData = [
    { id: 1, item: "Certificado CIPP", vencimento: "2026-01-20", tipo: "Frota" },
    { id: 2, item: "Licença SEMMA - Transporte", vencimento: "2026-05-15", tipo: "Ambiental" },
    { id: 3, item: "Curso MOPP - Condutores", vencimento: "2026-01-10", tipo: "Treinamento" }
  ];

  useEffect(() => {
    setIsReady(true);
    const loadData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').limit(40);
        if (data) setItems(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  // 🧠 MOTOR DE CÁLCULO DE PRAZOS
  const calcularPrazo = (dataVencimento) => {
    const hoje = new Date();
    const venc = new Date(dataVencimento);
    const diffTime = venc - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `Vencido há ${Math.abs(diffDays)} dias`, cor: '#ff4444' };
    if (diffDays <= 15) return { label: `Vence em ${diffDays} dias`, cor: '#ffbb33' };
    return { label: `${diffDays} dias restantes`, cor: '#25d366' };
  };

  if (!isReady) return null;

  return (
    <div style={s.app}>
      {/* SIDEBAR ELITE */}
      <nav style={s.sidebar}>
        <div style={s.logo}>
          <ShieldCheck color="#25d366" size={28}/> 
          <div>MAXIMUS <span style={s.phdBadge}>PhD</span></div>
        </div>
        
        <div style={s.navGroup}>
          <div style={s.label}>INTELIGÊNCIA</div>
          <TabBtn icon={<LayoutDashboard size={18}/>} label="Dashboard" active={abaAtiva === 'DASHBOARD'} onClick={() => setAbaAtiva('DASHBOARD')} />
          <TabBtn icon={<FileSearch size={18}/>} label="Auditoria" active={abaAtiva === 'AUDITORIA'} onClick={() => setAbaAtiva('AUDITORIA')} />
          <TabBtn icon={<Truck size={18}/>} label="Gestão de Frota" active={abaAtiva === 'FROTA'} onClick={() => setAbaAtiva('FROTA')} />
        </div>

        <div style={s.navGroup}>
          <div style={s.label}>FINANCEIRO AMBIENTAL</div>
          <button style={s.tab}><DollarSign size={18}/> Taxas & D-AUT</button>
        </div>

        <div style={s.sidebarFooter}>
          <button onClick={() => window.print()} style={s.mainAction}>
            <Printer size={18}/> IMPRIMIR LAUDO
          </button>
          <div style={s.profile}>
            <div style={s.avatar}>PS</div>
            <div style={{fontSize:11}}><b>Philipe Santana</b><br/><span style={{color:'#444'}}>Consultor PhD</span></div>
          </div>
        </div>
      </nav>

      <main style={s.main}>
        {loading ? <div style={s.loader}>CALCULANDO PRAZOS E SINCRONIZANDO...</div> : (
          <div style={s.content}>
            {abaAtiva === 'DASHBOARD' && (
              <>
                <div style={s.grid}>
                  <StatCard icon={<TrendingUp color="#25d366"/>} val="98%" label="Taxa de Conformidade" />
                  <StatCard icon={<Clock color="#ffbb33"/>} val="05" label="Prazos Críticos" />
                  <StatCard icon={<AlertCircle color="#ff4444"/>} val="R$ 1.2k" label="Taxas Pendentes" />
                </div>
                <div style={s.sectionHeader}>⚠️ ALERTAS IMEDIATOS (PRÓXIMOS 30 DIAS)</div>
                <div style={s.alertList}>
                   {frotaData.map(f => {
                     const status = calcularPrazo(f.vencimento);
                     return (
                       <div key={f.id} style={{...s.alertItem, borderLeft: `4px solid ${status.cor}`}}>
                         <div><b>{f.item}</b><br/><small>{f.tipo}</small></div>
                         <div style={{color: status.cor, fontWeight:'bold'}}>{status.label}</div>
                       </div>
                     )
                   })}
                </div>
              </>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>CÓD</th><th style={s.th}>CONDIÇÃO TÉCNICA</th><th style={s.th}>STATUS</th><th style={s.th}>EVIDÊNCIA</th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item['descricao de condicionante']}</td>
                        <td><StatusSelect /></td>
                        <td><Camera size={18} color="#222" cursor="pointer" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.grid}>
                 {frotaData.map(f => (
                   <div key={f.id} style={s.card}>
                      <Truck size={30} color="#25d366"/>
                      <h4 style={{margin:'15px 0 5px 0'}}>{f.item}</h4>
                      <p style={{fontSize:12, color:'#444'}}>Vencimento: {new Date(f.vencimento).toLocaleDateString()}</p>
                      <div style={{marginTop:10, color: calcularPrazo(f.vencimento).cor, fontWeight:'bold'}}>
                        {calcularPrazo(f.vencimento).label}
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES
const TabBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={active ? s.tabActive : s.tab}>{icon} {label}</button>
);

const StatCard = ({ icon, val, label }) => (
  <div style={s.card}>
    {icon}
    <div style={{fontSize:28, fontWeight:'bold', margin:'10px 0'}}>{val}</div>
    <div style={{fontSize:10, color:'#444', textTransform:'uppercase'}}>{label}</div>
  </div>
);

const StatusSelect = () => (
  <select style={s.select}>
    <option>🔴 PENDENTE</option>
    <option>🟢 CUMPRIDO</option>
  </select>
);

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff' },
  sidebar: { width: '260px', background: '#050505', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', padding: '25px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', color: '#25d366', marginBottom: '40px' },
  phdBadge: { background: '#25d366', color: '#000', fontSize: '9px', padding: '2px 5px', borderRadius: '3px', marginLeft: '5px' },
  navGroup: { marginBottom: '25px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' },
  tab: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left', fontSize: '13px', borderRadius: '8px' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #111', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '13px', borderRadius: '8px', fontWeight: 'bold' },
  sidebarFooter: { marginTop: 'auto' },
  mainAction: { background: '#25d366', color: '#000', width: '100%', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px', background: '#0a0a0a', padding: '12px', borderRadius: '10px' },
  avatar: { width: 30, height: 30, background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#25d366', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
  card: { background: '#050505', border: '1px solid #111', padding: '25px', borderRadius: '20px' },
  sectionHeader: { fontSize: '12px', color: '#444', fontWeight: 'bold', marginBottom: '15px' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  alertItem: { background: '#050505', padding: '15px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
  tableContainer: { background: '#050505', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', textAlign: 'left', color: '#25d366', fontSize: '11px', background: '#080808' },
  tr: { borderBottom: '1px solid #080808' },
  tdCode: { padding: '15px 20px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '15px 20px', color: '#888', fontSize: '12px', lineHeight: '1.5' },
  select: { background: '#000', color: '#fff', border: '1px solid #222', padding: '5px', borderRadius: '5px', fontSize: '10px' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366', letterSpacing: '3px', fontSize: '14px' }
};
