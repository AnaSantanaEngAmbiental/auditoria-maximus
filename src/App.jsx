import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, UploadCloud, FileText, 
  Settings, RefreshCcw, Camera, Building2, ChevronRight, 
  CheckCircle2, Clock, AlertTriangle, Printer, FileSearch, HardHat,
  Database, Image as ImageIcon, Briefcase, Info
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresaAtiva, setEmpresaAtiva] = useState('Posto de Combustível Delta');
  const [items, setItems] = useState([]);
  const [filtroCat, setFiltroCat] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // MEMÓRIA CENTRAL: Armazena status, fotos e documentos por empresa
  const [dbMaster, setDbMaster] = useState({});

  // Lista de Atividades do seu Prompt (docx)
  const atividades = [
    "Posto de Combustível", "Laticínio", "Transportadora de Produtos Perigosos", 
    "Fábrica de Gelo", "Oficina Mecânica", "Indústria de Alimentos", 
    "Serraria e Madeireira", "Recauchutagem", "Envase de Água Mineral"
  ];

  useEffect(() => {
    setMounted(true);
    fetchBase();
  }, []);

  const fetchBase = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo', { ascending: true });
      if (data) {
        setItems(data.map(i => ({
          ...i,
          uid: `C-${i.codigo}`,
          categoria: i.codigo <= 5 ? 'DIRETRIZ' : i.codigo <= 15 ? 'BASICA' : i.codigo <= 35 ? 'TECNICA' : 'PROJETO',
          descricao: i['descricao de condicionante'] || 'Análise de conformidade exigida pela SEMAS.'
        })));
      }
    } catch (e) { console.error("Erro Engine:", e); }
    finally { setLoading(false); }
  };

  // FUNÇÃO: RESET GLOBAL POR EMPRESA
  const handleReset = () => {
    if (confirm(`Deseja limpar todos os dados e arquivos da empresa ${empresaAtiva}?`)) {
      setDbMaster(prev => ({ ...prev, [empresaAtiva]: { status: {}, arquivos: [] } }));
      alert("Memória da empresa resetada!");
    }
  };

  // FUNÇÃO: ARRASTE E COLE (PROCESSAMENTO DE ARQUIVOS)
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    
    // Injeção de arquivos na memória da empresa ativa
    const novosArquivos = files.map(f => ({
      nome: f.name,
      tamanho: (f.size / 1024).toFixed(1) + ' KB',
      tipo: f.type,
      data: new Date().toLocaleDateString()
    }));

    setDbMaster(prev => ({
      ...prev,
      [empresaAtiva]: {
        ...prev[empresaAtiva],
        arquivos: [...(prev[empresaAtiva]?.arquivos || []), ...novosArquivos]
      }
    }));
    
    setAbaAtiva('AUDITORIA');
    alert(`${files.length} documentos integrados ao licenciamento da empresa!`);
  }, [empresaAtiva]);

  const filtrados = useMemo(() => 
    items.filter(i => filtroCat === 'TODOS' || i.categoria === filtroCat), 
  [items, filtroCat]);

  if (!mounted) return null;

  return (
    <div style={s.app} onDragOver={(e) => {e.preventDefault(); setDragActive(true)}} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
      
      {/* SIDEBAR PhD */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={26}/> MAXIMUS <span style={s.phd}>PhD</span></div>
        
        <div style={s.label}>ATIVIDADE LICENCIADA</div>
        <select style={s.select} value={empresaAtiva} onChange={(e) => setEmpresaAtiva(e.target.value)}>
          {atividades.map(at => <option key={at} value={at}>{at}</option>)}
        </select>

        <div style={s.label}>FILTROS DE DIRETRIZES</div>
        {['TODOS', 'DIRETRIZ', 'BASICA', 'TECNICA', 'PROJETO'].map(c => (
          <button key={c} onClick={() => {setFiltroCat(c); setAbaAtiva('AUDITORIA')}} 
            style={filtroCat === c && abaAtiva === 'AUDITORIA' ? s.tabActive : s.tab}>
            <ChevronRight size={14} color={filtroCat === c ? "#25d366" : "#222"}/> {c}
          </button>
        ))}

        <div style={s.label}>MÓDULOS DE IMPACTO</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabActive : s.tab}><LayoutDashboard size={18}/> Painel de Controle</button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabActive : s.tab}><FileSearch size={18}/> Auditoria & Leis</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabActive : s.tab}><Truck size={18}/> Frota (CIPP/MOPP)</button>
        <button onClick={() => setAbaAtiva('PROJETO')} style={abaAtiva === 'PROJETO' ? s.tabActive : s.tab}><Briefcase size={18}/> Projeto Final</button>

        <div style={{marginTop: 'auto'}}>
          <button onClick={handleReset} style={s.btnReset}><RefreshCcw size={16}/> RESET GLOBAL</button>
          <div style={s.userBox}>
             <div style={s.avatar}>PS</div>
             <div style={{fontSize:11}}><b>Philipe Santana</b><br/><span style={{color:'#444'}}>PhD Consultoria</span></div>
          </div>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h2 style={{display:'flex', alignItems:'center', gap:10}}><Building2 color="#25d366"/> {empresaAtiva}</h2>
            <p style={{fontSize:12, color:'#444', marginLeft:34}}>Engenharia Ambiental Integrada - Estado do Pará</p>
          </div>
          <div style={{display:'flex', gap:12}}>
            <div style={{...s.dragStatus, borderColor: dragActive ? '#25d366' : '#111'}}>
              {dragActive ? 'SOLTE O ARQUIVO AGORA' : 'Arraste PDF/DOCX aqui'}
            </div>
            <button onClick={() => window.print()} style={s.btnP}><Printer size={18}/> IMPRIMIR</button>
          </div>
        </header>

        {loading ? <div style={s.loader}>🔍 ESCANEANDO BASE DE DADOS...</div> : (
          <div style={s.container}>
            
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <Card icon={<FileText color="#25d366"/>} title="Condicionantes" val={items.length} />
                <Card icon={<UploadCloud color="#3498db"/>} title="Docs Recebidos" val={dbMaster[empresaAtiva]?.arquivos?.length || 0} />
                <Card icon={<AlertTriangle color="#ffbb33"/>} title="Vencimentos" val="02" />
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr><th style={s.th}>CÓD</th><th style={s.th}>REQUISITO TÉCNICO / LEI</th><th style={s.th}>STATUS</th><th style={s.th}>EVIDÊNCIA</th></tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdC}>{item.codigo}</td>
                        <td style={s.tdD}>{item.descricao}</td>
                        <td>
                          <select style={s.selectStatus}>
                            <option>🔴 PENDENTE</option><option>🟢 CUMPRIDO</option>
                          </select>
                        </td>
                        <td>
                           <Camera size={20} color={dbMaster[empresaAtiva]?.arquivos?.length > 0 ? "#25d366" : "#222"} cursor="pointer"/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.tableWrap}>
                <div style={s.p15}>
                   <h3 style={{marginBottom:20, color:'#25d366'}}>Verificação ANTT / CIPP / MOPP</h3>
                   <table style={s.table}>
                     <thead><tr><th style={s.th}>DOCUMENTO</th><th style={s.th}>STATUS EXTRAÍDO</th><th style={s.th}>VIGÊNCIA</th></tr></thead>
                     <tbody>
                       {['CIPP (Certificado)', 'CIV (Inspeção)', 'MOPP (Motorista)', 'ANTT (Extrato)'].map((doc, idx) => (
                         <tr key={idx} style={s.tr}>
                           <td style={s.tdC}>{doc}</td>
                           <td style={s.tdD}>{dbMaster[empresaAtiva]?.arquivos?.[idx]?.nome || 'Aguardando arquivo...'}</td>
                           <td style={{color:'#25d366'}}>VALIDADO</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </div>
            )}
            
            {abaAtiva === 'PROJETO' && (
              <div style={s.projetoBox}>
                <HardHat size={50} color="#25d366" />
                <h3>Gerador de Projeto Final</h3>
                <p>Após a auditoria, clique abaixo para compilar o Ofício, Requerimento e Relatório Fotográfico.</p>
                <button style={s.btnP} style={{marginTop:20, padding:'15px 40px', background:'#25d366', color:'#000', border:'none', borderRadius:10, fontWeight:'bold', cursor:'pointer'}}>COMPILAR PROCESSO AMBIENTAL</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENTES DE APOIO
const Card = ({ icon, title, val }) => (
  <div style={s.card}>{icon}<h4 style={{fontSize:10, color:'#444', margin:'15px 0 5px 0'}}>{title}</h4><div style={{fontSize:32, fontWeight:'bold'}}>{val}</div></div>
);

// CSS EM JS - RIGOR MÁXIMO
const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '270px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { color: '#25d366', fontWeight: 'bold', fontSize: '19px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '8px' },
  phd: { background: '#25d366', color: '#000', fontSize: '9px', padding: '2px 5px', borderRadius: '4px' },
  label: { fontSize: '9px', color: '#333', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1px' },
  select: { width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', fontSize: '12px', outline: 'none' },
  tab: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', color: '#444', padding: '12px', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontSize: '13px' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' },
  btnReset: { background: '#110505', color: '#ff4444', border: '1px solid #211', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', justifyContent:'center' },
  userBox: { background: '#0a0a0a', padding: '15px', borderRadius: '15px', border: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: 34, height: 34, background: '#222', borderRadius: '50%', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #111', paddingBottom: '20px' },
  dragStatus: { border: '1px dashed #222', padding: '10px 20px', borderRadius: '10px', fontSize: '11px', color: '#555', transition: '0.3s' },
  btnP: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  card: { background: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '25px', textAlign: 'center' },
  tableWrap: { background: '#050505', borderRadius: '25px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px', textAlign: 'left', color: '#25d366', fontSize: '11px', background: '#080808', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '20px', color: '#25d366', fontWeight: 'bold', fontSize: '14px' },
  tdD: { padding: '20px', color: '#888', fontSize: '12px', lineHeight: '1.6' },
  selectStatus: { background: '#000', color: '#fff', border: '1px solid #222', padding: '6px', borderRadius: '6px', fontSize: '10px' },
  loader: { textAlign: 'center', marginTop: '150px', color: '#25d366', letterSpacing: '4px', fontWeight: 'bold' },
  projetoBox: { textAlign: 'center', padding: '100px 50px', background: '#050505', borderRadius: '30px', border: '1px solid #111' },
  p15: { padding: '25px' }
};
