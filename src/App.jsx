import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, FileSearch, HardHat, 
  Truck, Calendar, ClipboardCheck, RefreshCw, FileText, 
  ChevronRight, ExternalLink, Scale, UploadCloud, MessageSquare, Mail, 
  GripVertical, Trash2, BellRing
} from 'lucide-react';

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
  const [dragActive, setDragActive] = useState(false);

  const projetoInfo = { 
    empresa: "Cardoso & Rates Engenharia", 
    processo: "2023/12345-SEMMA", 
    tecnico: "Philipe Santana",
    email: "contato@cardosorates.com.br",
    whatsapp: "5591988887777"
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
          categoria: i.codigo <= 10 ? 'BASICA' : i.codigo <= 30 ? 'TECNICA' : 'PROJETO'
        }));
        setItems(formatted);
        const initialStatus = {};
        formatted.forEach(i => initialStatus[i.codigo] = "PENDENTE");
        setStatusMap(initialStatus);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // 1. Alerta por WhatsApp/Email (Simulação de Disparo)
  const enviarAlerta = (tipo, msg) => {
    const url = tipo === 'zap' 
      ? `https://api.whatsapp.com/send?phone=${projetoInfo.whatsapp}&text=${encodeURIComponent(msg)}`
      : `mailto:${projetoInfo.email}?subject=ALERTA MAXIMUS&body=${msg}`;
    window.open(url, '_blank');
  };

  // 2. Lógica de Arraste e Cole (Upload de Arquivos)
  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  if (!mounted) return <div style={{background:'#000', height:'100vh'}} />;

  return (
    <div style={s.app}>
      {/* SIDEBAR COM 10+ FUNCIONALIDADES */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={26}/> MAXIMUS <span style={{color:'#fff', fontSize:'10px'}}>PhD</span></div>
        
        <div style={s.label}>GESTÃO DE ATIVOS</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}><LayoutDashboard size={18}/> Dashboard Global</button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}><FileSearch size={18}/> Auditoria Técnica</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabBtnActive : s.tabBtn}><Truck size={18}/> Frota & Logística</button>
        <button onClick={() => setAbaAtiva('ARQUIVOS')} style={abaAtiva === 'ARQUIVOS' ? s.tabBtnActive : s.tabBtn}><UploadCloud size={18}/> Nuvem de Arquivos</button>

        <div style={s.label}>NOTIFICAÇÕES ATIVAS</div>
        <button onClick={() => enviarAlerta('zap', 'Maximus Alerta: Licença Vencendo em 5 dias!')} style={s.btnZap}><MessageSquare size={14}/> Alerta WhatsApp</button>
        <button onClick={() => enviarAlerta('mail', 'Relatório de Não Conformidade Detectado.')} style={s.btnMail}><Mail size={14}/> Alerta E-mail</button>

        <div style={s.label}>LEGISLAÇÃO</div>
        <a href="#" style={s.linkLegis}><Scale size={14}/> SEMAS-PA</a>
        <a href="#" style={s.linkLegis}><Scale size={14}/> SEMMA-Belém</a>

        <div style={{marginTop: 'auto', paddingTop: '20px'}}>
          <button onClick={() => window.print()} style={s.procuracaoBtn}><FileText size={18}/> Gerar Procuração</button>
          <div style={s.userBox}>
             <div style={s.avatar}>P</div>
             <div><div style={{fontSize:11, fontWeight:'bold'}}>{projetoInfo.tecnico}</div><div style={{fontSize:9, color:'#444'}}>Consultor Master</div></div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO DINÂMICA */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}><Search size={20} color="#333"/><input style={s.input} placeholder="Busca inteligente em toda a base..." onChange={(e) => setBusca(e.target.value)} /></div>
          <div style={{display:'flex', gap:'10px'}}>
             <button style={s.notifBtn}><BellRing size={18} color="#25d366"/></button>
             <button onClick={() => window.print()} style={s.pdfBtn}><Printer size={16}/> LAUDO PDF</button>
          </div>
        </header>

        {loading ? <div style={s.loader}>SINCRONIZANDO INTELIGÊNCIA...</div> : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><CheckCircle2 color="#25d366" size={32}/><h3>{items.length}</h3><p>Condicionantes</p></div>
                <div style={s.card}><HardHat color="#25d366" size={32}/><h3>100%</h3><p>Conformidade</p></div>
                <div style={s.card}><AlertCircle color="#ff4444" size={32}/><h3>02</h3><p>Alertas Críticos</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <div style={s.tableHeader}><span>📌 <b>AUDITORIA TÉCNICA</b></span><span>{projetoInfo.empresa}</span></div>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>#</th><th style={s.th}>EXIGÊNCIA AMBIENTAL</th><th style={s.th}>STATUS</th><th style={s.th}>DOCS</th></tr></thead>
                  <tbody>
                    {items.slice(0, 15).map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}><GripVertical size={14} color="#222"/> {item.codigo}</td>
                        <td style={s.tdDesc}>{item.textoLimpo}</td>
                        <td style={s.tdAction}>
                          <select style={{...s.selectS, color: statusMap[item.codigo] === 'CONCLUÍDO' ? '#25d366' : '#ff4444'}} value={statusMap[item.codigo]} onChange={(e) => setStatusMap({...statusMap, [item.codigo]: e.target.value})}>
                            <option value="PENDENTE">PENDENTE</option><option value="CONCLUÍDO">CONCLUÍDO</option>
                          </select>
                        </td>
                        <td><UploadCloud size={16} color="#444" cursor="pointer"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.grid}>
                <div style={s.card}><ClipboardCheck color="#25d366" size={40}/><h4>CIPP</h4><p>15/05/2026</p><span style={s.tagV}>VALIDADO</span></div>
                <div style={s.card}><Calendar color="#ff4444" size={40}/><h4>MOPP</h4><p>João Silva</p><span style={s.tagR}>RENOVAR</span></div>
                <div style={s.card}><Truck color="#25d366" size={40}/><h4>Licença</h4><p>Transporte</p><span style={s.tagV}>ATIVO</span></div>
              </div>
            )}

            {abaAtiva === 'ARQUIVOS' && (
              <div 
                style={{...s.dropZone, borderColor: dragActive ? '#25d366' : '#222'}} 
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag}
              >
                <UploadCloud size={50} color={dragActive ? '#25d366' : '#333'} />
                <h2>Arraste e Solte seus arquivos aqui</h2>
                <p>Relatórios, Fotos de Campo e Licenças (PDF, JPG, PNG)</p>
                <button style={s.procuracaoBtn}>Ou selecione do computador</button>
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
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', fontSize: '13px' },
  tabBtnActive: { width: '100%', padding: '12px', background: '#0a0a0a', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold' },
  btnZap: { width: '100%', padding: '10px', background: '#075e54', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  btnMail: { width: '100%', padding: '10px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  linkLegis: { display: 'flex', alignItems: 'center', gap: '10px', color: '#444', textDecoration: 'none', fontSize: '12px', marginBottom: '10px' },
  procuracaoBtn: { width: '100%', padding: '14px', background: '#25d366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
  userBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#0a0a0a', borderRadius: '12px' },
  avatar: { width: 30, height: 30, background: '#25d366', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', gap: '20px' },
  searchBox: { background: '#050505', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px', flex: 1, border: '1px solid #111' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '14px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#fff', color: '#000', padding: '0 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  notifBtn: { background: '#0a0a0a', border: '1px solid #111', borderRadius: '10px', padding: '10px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#050505', padding: '30px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' },
  tableContainer: { background: '#050505', borderRadius: '20px', border: '1px solid #111' },
  tableHeader: { padding: '15px 20px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px 20px', color: '#25d366', fontSize: '11px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdCode: { padding: '15px 20px', color: '#25d366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  tdDesc: { padding: '15px 20px', color: '#999', fontSize: '12px', lineHeight: '1.6' },
  tdAction: { padding: '15px 20px' },
  selectS: { background: '#000', border: '1px solid #111', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
  dropZone: { marginTop: '50px', height: '300px', border: '2px dashed #222', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' },
  tagV: { fontSize: '9px', background: '#0a2212', color: '#25d366', padding: '4px 8px', borderRadius: '4px', marginTop: '10px', display: 'inline-block' },
  tagR: { fontSize: '9px', background: '#2a0a0a', color: '#ff4444', padding: '4px 8px', borderRadius: '4px', marginTop: '10px', display: 'inline-block' },
  loader: { textAlign: 'center', marginTop: '150px', color: '#25d366', letterSpacing: '5px', fontWeight: 'bold' }
};
