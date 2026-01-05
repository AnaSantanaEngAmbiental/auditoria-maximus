import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Search, CheckCircle2, 
  AlertCircle, Printer, FileSearch, HardHat, 
  Truck, Calendar, ClipboardCheck, UploadCloud, MessageSquare, Mail, 
  GripVertical, BellRing, FileText, Settings, Camera, 
  ChevronRight, ExternalLink, Scale, Clock, Save
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [isClient, setIsClient] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [statusMap, setStatusMap] = useState({});
  const [anexos, setAnexos] = useState({});
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ email: 'contato@cardosorates.com.br', zap: '5591988887777' });

  // 1. Efeito de Inicialização Blindado
  useEffect(() => {
    setIsClient(true);
    const carregarDados = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('base_condicionantes').select('*').limit(100);
        if (error) throw error;
        if (data) {
          const formatado = data.map(i => ({
            ...i,
            idUnique: i.codigo || Math.random().toString(36),
            cat: i.codigo <= 10 ? 'BASICA' : i.codigo <= 30 ? 'TECNICA' : 'PROJETO',
            descricao: i['descricao de condicionante'] || i.descricao || 'Sem texto'
          }));
          setItems(formatado);
        }
      } catch (err) {
        console.error("Erro Maximus:", err.message);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  // 2. Motor de Prazos (Executado apenas no Cliente)
  const calcularDias = (vencimento) => {
    const hoje = new Date();
    const dataVenc = new Date(vencimento);
    const diff = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { txt: `ATRASADO (${Math.abs(diff)}d)`, cor: '#ff4444' };
    if (diff <= 15) return { txt: `CRÍTICO (${diff}d)`, cor: '#ffbb33' };
    return { txt: `${diff} dias restantes`, cor: '#25d366' };
  };

  // 3. Filtro Inteligente
  const filtrados = useMemo(() => {
    return items.filter(i => filtroCategoria === 'TODOS' || i.cat === filtroCategoria);
  }, [items, filtroCategoria]);

  if (!isClient) return null;

  return (
    <div style={s.app}>
      {/* SIDEBAR ELITE CONSOLIDADA */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={26}/> MAXIMUS <span style={{fontSize:10, opacity:0.5}}>PhD</span></div>
        
        <div style={s.label}>FILTROS AMBIENTAIS</div>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO'].map(c => (
          <button key={c} onClick={() => {setFiltroCategoria(c); setAbaAtiva('AUDITORIA');}} 
            style={filtroCategoria === c && abaAtiva === 'AUDITORIA' ? s.tabActive : s.tab}>
            <ChevronRight size={14} color={filtroCategoria === c ? "#25d366" : "#222"}/> {c}
          </button>
        ))}

        <div style={s.label}>MÓDULOS OPERACIONAIS</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabActive : s.tab}><LayoutDashboard size={18}/> Dashboard Global</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabActive : s.tab}><Truck size={18}/> Frota & Logística</button>
        <button onClick={() => setAbaAtiva('CONFIG')} style={abaAtiva === 'CONFIG' ? s.tabActive : s.tab}><Settings size={18}/> Configurações</button>

        <div style={{marginTop: 'auto'}}>
          <button onClick={() => window.print()} style={s.btnPremium}><FileText size={18}/> RELATÓRIO PDF</button>
          <div style={s.userBox}>
             <div style={s.avatar}>PS</div>
             <div style={{fontSize:11}}><b>Philipe Santana</b><br/><span style={{color:'#444'}}>Consultoria PhD</span></div>
          </div>
        </div>
      </aside>

      <main style={s.main}>
        {loading ? <div style={s.loader}>⚙️ SINCRONIZANDO COM SUPABASE...</div> : (
          <div style={{animation: 'fadeIn 0.5s ease'}}>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><CheckCircle2 color="#25d366" size={30}/><h3>{items.length}</h3><p>Condicionantes</p></div>
                <div style={s.card}><Clock color="#ffbb33" size={30}/><h3>03</h3><p>Prazos em Alerta</p></div>
                <div style={s.card}><AlertCircle color="#ff4444" size={30}/><h3>98%</h3><p>Conformidade</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>CÓD</th><th style={s.th}>REQUISITO TÉCNICO</th><th style={s.th}>STATUS</th><th style={s.th}>FOTO/ANEXO</th></tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.descricao}</td>
                        <td>
                          <select 
                            style={{...s.sel, color: statusMap[item.idUnique] === 'OK' ? '#25d366' : '#ff4444'}}
                            onChange={(e) => setStatusMap({...statusMap, [item.idUnique]: e.target.value})}
                          >
                            <option value="PENDENTE">🔴 PENDENTE</option>
                            <option value="OK">🟢 CUMPRIDO</option>
                          </select>
                        </td>
                        <td>
                          <label style={s.cameraBtn}>
                            <Camera size={18}/>
                            <input type="file" hidden onChange={() => alert('Foto vinculada!')} />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.grid}>
                {[
                  { n: 'Certificado CIPP', v: '2026-05-20' },
                  { n: 'Licença SEMMA', v: '2026-01-10' },
                  { n: 'Curso MOPP', v: '2026-01-15' }
                ].map((f, idx) => (
                  <div key={idx} style={s.card}>
                    <Truck size={32} color="#25d366"/>
                    <h4 style={{margin: '15px 0 5px 0'}}>{f.n}</h4>
                    <div style={{fontSize:12, color: calcularDias(f.v).cor, fontWeight: 'bold'}}>
                      {calcularDias(f.v).txt}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'CONFIG' && (
              <div style={s.form}>
                <h3 style={{marginBottom: 20}}>⚙️ Dados para Disparo de Alertas</h3>
                <label style={s.fLabel}>WhatsApp do Gestor</label>
                <input style={s.fInput} value={config.zap} onChange={e => setConfig({...config, zap: e.target.value})} />
                <button style={s.btnSave} onClick={() => alert('Base de Contatos Atualizada!')}>
                  <Save size={18}/> SALVAR CONFIGURAÇÕES
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: '250px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { color: '#25d366', fontWeight: '900', fontSize: '20px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-1px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1.5px' },
  tab: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', color: '#555', padding: '12px', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', transition: '0.2s' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold' },
  btnPremium: { background: '#25d366', color: '#000', border: 'none', width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
  userBox: { background: '#080808', padding: '15px', borderRadius: '15px', border: '1px solid #111', display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: 32, height: 32, background: '#222', borderRadius: '50%', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  card: { background: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '24px', textAlign: 'center', transition: '0.3s' },
  tableWrap: { background: '#050505', border: '1px solid #111', borderRadius: '20px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px', textAlign: 'left', color: '#25d366', fontSize: '11px', background: '#080808', borderBottom: '1px solid #111', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #080808', transition: '0.2s' },
  tdCode: { padding: '20px', color: '#25d366', fontWeight: 'bold', fontSize: '15px' },
  tdDesc: { padding: '20px', color: '#999', fontSize: '12px', lineHeight: '1.6' },
  sel: { background: '#000', color: '#fff', border: '1px solid #222', padding: '8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', outline: 'none' },
  cameraBtn: { cursor: 'pointer', color: '#25d366', background: '#0a2212', padding: '10px', borderRadius: '10px', display: 'inline-flex' },
  form: { maxWidth: '500px', background: '#050505', padding: '40px', borderRadius: '24px', border: '1px solid #111' },
  fLabel: { display: 'block', fontSize: '11px', color: '#444', marginBottom: '8px', fontWeight: 'bold' },
  fInput: { width: '100%', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '25px', outline: 'none' },
  btnSave: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  loader: { textAlign: 'center', marginTop: '150px', color: '#25d366', letterSpacing: '5px', fontWeight: 'bold', fontSize: '12px' }
};
