import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, FileSearch, HardHat, 
  Truck, Calendar, ClipboardCheck, UploadCloud, MessageSquare, Mail, 
  GripVertical, BellRing, FileText, Settings, Camera, 
  ChevronRight, ExternalLink, Scale, Clock, Save, RefreshCcw, Building2, User, Database, Info
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [isClient, setIsClient] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresaAtiva, setEmpresaAtiva] = useState('Posto Ipiranga Ltda');
  const [items, setItems] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Estados Persistentes por Empresa
  const [dataMaster, setDataMaster] = useState({}); // Armazena Status e Fotos por empresa

  // Base de Dados de Frota Dinâmica (conforme seu prompt)
  const frotasPorEmpresa = {
    'Posto Ipiranga Ltda': [
      { id: 1, placa: 'OTV-2024', motorista: 'João Silva', mopp: 'Ativo', cipp: '2026-05-10', antt: 'Regular' },
      { id: 2, placa: 'PA-9988', motorista: 'Carlos Souza', mopp: 'Vencido', cipp: '2025-12-30', antt: 'Regular' }
    ],
    'Transportadora TransNorte': [
      { id: 3, placa: 'TNT-1010', motorista: 'Ana Santos', mopp: 'Ativo', cipp: '2027-02-15', antt: 'Regular' }
    ]
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('base_condicionantes').select('*').limit(200);
      if (error) throw error;
      setItems(data.map(i => ({
        ...i,
        uid: `ID-${i.codigo}`,
        cat: i.codigo <= 5 ? 'DIRETRIZ' : i.codigo <= 20 ? 'BASICA' : 'TECNICA',
        desc: i['descricao de condicionante'] || 'Descrição técnica pendente de análise.'
      })));
    } catch (e) {
      console.error("Erro Crítico Maximus:", e);
    } finally {
      setLoading(false);
    }
  };

  // Funções de Gerenciamento
  const updateStatus = (id, status) => {
    setDataMaster(prev => ({
      ...prev,
      [empresaAtiva]: { ...(prev[empresaAtiva] || {}), [id]: { status } }
    }));
  };

  const resetGlobal = () => {
    if(window.confirm("Deseja resetar todos os dados de conformidade desta empresa?")) {
      setDataMaster(prev => ({ ...prev, [empresaAtiva]: {} }));
    }
  };

  // Motor de Arraste e Cole (XLSX, PDF, FOTOS)
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    alert(`Maximus Engine detectou ${files.length} arquivo(s). Iniciando leitura de Metadados e OCR...`);
  }, []);

  const filtrados = useMemo(() => 
    items.filter(i => filtroCategoria === 'TODOS' || i.cat === filtroCategoria), 
  [items, filtroCategoria]);

  if (!isClient) return null;

  return (
    <div style={s.app} onDragOver={(e) => {e.preventDefault(); setDragActive(true);}} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
      
      {/* SIDEBAR TÉCNICA */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={26}/> MAXIMUS <span style={s.phd}>PhD</span></div>
        
        <div style={s.label}>ATIVIDADES & EMPRESAS</div>
        <select style={s.empSelect} value={empresaAtiva} onChange={(e) => setEmpresaAtiva(e.target.value)}>
          <option>Posto Ipiranga Ltda</option>
          <option>Laticínio Pará S.A</option>
          <option>Transportadora TransNorte</option>
          <option>Fábrica de Gelo Ártico</option>
          <option>Oficina Mecânica Precision</option>
        </select>

        <div style={s.label}>FILTROS SEMAS/PA</div>
        {['TODOS', 'DIRETRIZ', 'BASICA', 'TECNICA'].map(c => (
          <button key={c} onClick={() => {setFiltroCategoria(c); setAbaAtiva('AUDITORIA');}} 
            style={filtroCategoria === c && abaAtiva === 'AUDITORIA' ? s.tabA : s.tab}>
            <ChevronRight size={14} color={filtroCategoria === c ? "#25d366" : "#222"}/> {c}
          </button>
        ))}

        <div style={s.label}>SISTEMA INTEGRADO</div>
        <TabBtn act={abaAtiva === 'DASHBOARD'} clk={() => setAbaAtiva('DASHBOARD')} ico={<LayoutDashboard size={18}/>} txt="Dashboard Global" />
        <TabBtn act={abaAtiva === 'AUDITORIA'} clk={() => setAbaAtiva('AUDITORIA')} ico={<FileSearch size={18}/>} txt="Condicionantes" />
        <TabBtn act={abaAtiva === 'FROTA'} clk={() => setAbaAtiva('FROTA')} ico={<Truck size={18}/>} txt="Controle de Frota" />
        <TabBtn act={abaAtiva === 'ARQUIVOS'} clk={() => setAbaAtiva('ARQUIVOS')} ico={<UploadCloud size={18}/>} txt="Arraste & Cole" />

        <div style={{marginTop: 'auto'}}>
          <button onClick={resetGlobal} style={s.btnReset}><RefreshCcw size={14}/> RESETAR EMPRESA</button>
          <div style={s.userBox}>
             <div style={s.avatar}>PS</div>
             <div style={{fontSize:11}}><b>Philipe Santana</b><br/><span style={{color:'#444'}}>Engenheiro Ambiental</span></div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
             <h2 style={{display:'flex', alignItems:'center', gap:10}}><Building2 color="#25d366"/> {empresaAtiva}</h2>
             <p style={{fontSize:12, color:'#444', marginLeft:34}}>Análise Documental e Técnica v10.0</p>
          </div>
          <div style={{display:'flex', gap:10}}>
             <button style={s.btnSec}><Mail size={16}/> NOTIFICAR</button>
             <button onClick={() => window.print()} style={s.btnPri}><Printer size={16}/> GERAR RELATÓRIO</button>
          </div>
        </header>

        {loading ? <div style={s.loader}>ESTRUTURANDO DADOS...</div> : (
          <div style={s.content}>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <Card icon={<CheckCircle2 color="#25d366"/>} title="Condicionantes" val={items.length} color="#25d366" />
                <Card icon={<Clock color="#ffbb33"/>} title="Vencimentos" val="03" color="#ffbb33" />
                <Card icon={<Database color="#25d366"/>} title="Empresas" val="05" color="#fff" />
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>CÓD</th><th style={s.th}>DESCRIÇÃO DA CONDICIONANTE</th><th style={s.th}>STATUS</th><th style={s.th}>EVIDÊNCIA</th></tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdC}>{item.codigo}</td>
                        <td style={s.tdD}>{item.desc}</td>
                        <td>
                          <select 
                            style={s.select} 
                            value={dataMaster[empresaAtiva]?.[item.uid]?.status || 'PENDENTE'}
                            onChange={(e) => updateStatus(item.uid, e.target.value)}
                          >
                            <option value="PENDENTE">🔴 PENDENTE</option>
                            <option value="OK">🟢 CUMPRIDO</option>
                          </select>
                        </td>
                        <td><Camera size={20} color="#222" cursor="pointer"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>PLACA</th><th style={s.th}>MOTORISTA</th><th style={s.th}>MOPP</th><th style={s.th}>CIPP</th><th style={s.th}>ANTT</th></tr>
                  </thead>
                  <tbody>
                    {(frotasPorEmpresa[empresaAtiva] || []).map(v => (
                      <tr key={v.id} style={s.tr}>
                        <td style={s.tdC}>{v.placa}</td>
                        <td style={s.tdD}>{v.motorista}</td>
                        <td style={{color: v.mopp === 'Ativo' ? '#25d366' : '#ff4444', fontWeight:'bold'}}>{v.mopp}</td>
                        <td>{v.cipp}</td>
                        <td style={{color:'#25d366'}}>{v.antt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'ARQUIVOS' && (
              <div style={{...s.dropZone, borderColor: dragActive ? '#25d366' : '#111'}}>
                <UploadCloud size={80} color={dragActive ? '#25d366' : '#222'}/>
                <h3>Motor Maximus de Processamento</h3>
                <p>Arraste PDF da ANTT, CIPP ou Fotos de Campo</p>
                <div style={s.dragBadges}>
                  <span>DOCX</span><span>XLSX</span><span>PDF</span><span>JPEG</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-componentes para Limpeza de Código
const TabBtn = ({ act, clk, ico, txt }) => (
  <button onClick={clk} style={act ? s.tabA : s.tab}>{ico} {txt}</button>
);

const Card = ({ icon, title, val, color }) => (
  <div style={s.card}>
    <div style={{display:'flex', justifyContent:'center', marginBottom:15}}>{icon}</div>
    <h4 style={{fontSize:11, color:'#444', textTransform:'uppercase'}}>{title}</h4>
    <div style={{fontSize:40, fontWeight:'bold', color:color}}>{val}</div>
  </div>
);

// Estilização Profissional (CSS-in-JS)
const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '270px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { color: '#25d366', fontWeight: 'bold', fontSize: '20px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '10px' },
  phd: { background: '#25d366', color: '#000', fontSize: '9px', padding: '2px 6px', borderRadius: '4px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1.5px' },
  empSelect: { width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', fontSize: '12px', outline: 'none' },
  tab: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', color: '#555', padding: '12px', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontSize: '13px', transition: '0.2s' },
  tabA: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' },
  btnReset: { background: '#1a0a0a', color: '#ff4444', border: '1px solid #311', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', justifyContent:'center' },
  userBox: { background: '#0a0a0a', padding: '15px', borderRadius: '15px', border: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: 34, height: 34, background: '#222', borderRadius: '50%', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto', background: '#000' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #111' },
  btnPri: { background: '#25d366', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSec: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  card: { background: '#050505', border: '1px solid #111', padding: '35px', borderRadius: '28px', textAlign: 'center' },
  tableWrap: { background: '#050505', borderRadius: '24px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px', textAlign: 'left', color: '#25d366', fontSize: '11px', background: '#080808', borderBottom: '1px solid #111', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #080808', transition: '0.2s' },
  tdC: { padding: '20px', color: '#25d366', fontWeight: 'bold', fontSize: '14px' },
  tdD: { padding: '20px', color: '#999', fontSize: '12px', lineHeight: '1.7' },
  select: { background: '#000', color: '#fff', border: '1px solid #222', padding: '8px', borderRadius: '8px', fontSize: '11px', outline: 'none' },
  dropZone: { height: '400px', border: '2px dashed #111', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333' },
  dragBadges: { display: 'flex', gap: '10px', marginTop: '20px' },
  loader: { textAlign: 'center', marginTop: '150px', color: '#25d366', letterSpacing: '5px', fontWeight: 'bold' }
};
