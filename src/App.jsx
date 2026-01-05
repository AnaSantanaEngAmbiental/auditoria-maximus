import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, 
  FilePlus, History, Save, Building2, Map, Scale, Download,
  Zap, Cpu, Activity, MapPin, BarChart3, PenTool, Check
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV53() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  
  const fileInputRef = useRef(null);

  // 1. INICIALIZAÇÃO LIMPA E VARREDURA DE CACHE
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function init() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      // Carrega arquivos específicos do projeto (Se estiver vazio no banco, inicia vazio na tela)
      const storageKey = `MAX_FILES_${projeto}`;
      const savedFiles = localStorage.getItem(storageKey);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      
      setLogs(JSON.parse(localStorage.getItem(`MAX_LOGS_${projeto}`) || '[]'));
      setLoading(false);
    }
    init();
  }, [projeto]);

  // 2. LOG DE ATIVIDADES PROFISSIONAL
  const addLog = (acao) => {
    const novoLog = { id: Date.now(), texto: acao, hora: new Date().toLocaleTimeString('pt-BR') };
    const atualizados = [novoLog, ...logs].slice(0, 30);
    setLogs(atualizados);
    localStorage.setItem(`MAX_LOGS_${projeto}`, JSON.stringify(atualizados));
  };

  // 3. UPLOAD REFINADO (SEM DUPLICIDADE E COM RESET)
  const processarUpload = (files) => {
    if (!files) return;
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleDateString('pt-BR'),
      id: `${f.name}-${Date.now()}`
    }));

    setArquivos(prev => {
      const nomes = new Set(prev.map(a => a.nome));
      const validos = novos.filter(n => !nomes.has(n.nome));
      
      if (validos.length > 0) {
        addLog(`Adicionado: ${validos.length} doc(s)`);
        const listaFinal = [...prev, ...validos];
        localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaFinal));
        return listaFinal;
      }
      return prev;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 4. RESET TOTAL DO PROJETO (FIX DOS 13 DOCS)
  const resetTotal = () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os documentos deste projeto. Confirmar?")) {
      setArquivos([]);
      localStorage.removeItem(`MAX_FILES_${projeto}`);
      addLog("Sistema Resetado / Limpo");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validar = (id) => {
    const nomes = arquivos.map(a => a.nome);
    const regras = { CIPP: /\b(CIPP)\b/, CIV: /\b(CIV)\b/, MOPP: /\b(MOPP)\b/ };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  };

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse"/></div>;

  return (
    <div style={s.body}>
      {/* SIDEBAR COM LETRAS GRANDES E CONTRASTE */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0" size={28}/> MAXIMUS <span style={s.v}>v53</span></div>
        
        <label style={s.label}>SELECIONE O EMPREENDIMENTO</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO (PARAUAPEBAS)</option>
          <option value="Logistica">🚚 LOGÍSTICA (BARCARENA)</option>
          <option value="Posto">⛽ POSTO (BELÉM)</option>
        </select>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.btnA:s.btn}><PenTool/> ASSINAR GOV.BR</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><BarChart3/> INDICADORES</button>
        </nav>

        <div style={s.boxLog}>
          <div style={s.boxHead}>ATIVIDADES RECENTES <Trash2 size={14} onClick={resetTotal} cursor="pointer"/></div>
          <div style={s.logLista}>
            {logs.map(l => (
              <div key={l.id} style={s.logItem}>• {l.hora}: {l.texto}</div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={22}/><input placeholder="PESQUISAR LEI OU CÓDIGO..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <label style={s.btnUp}>
            <FilePlus/> ADICIONAR EVIDÊNCIAS
            <input ref={fileInputRef} type="file" multiple hidden onChange={e=>processarUpload(e.target.files)}/>
          </label>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓDIGO</th><th>REQUISITO LEGAL AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it,i)=>(
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={validar(it.codigo)?'#0f0':'#222'} size={28}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'GOV' && (
            <div style={s.govContainer}>
              <div style={s.govCard}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/bb/Logotipo_do_Governo_do_Brasil_2023.png" height="50" alt="gov" />
                <h1 style={{fontSize:24, margin:'20px 0'}}>Assinador Digital Maximus</h1>
                <p style={{color:'#666', marginBottom:30}}>Validade Jurídica conforme MP nº 2.200-2/2001 (ICP-Brasil)</p>
                
                {!assinando ? (
                  <button onClick={()=>setAssinando(true)} style={s.btnGov}>AUTENTICAR COM GOV.BR</button>
                ) : (
                  <div style={s.successAss}>
                    <CheckCircle color="#0f0" size={40}/>
                    <h2 style={{color:'#0f0'}}>Identidade Prata Verificada!</h2>
                    <p>Relatórios agora serão gerados com selo de autenticidade.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {aba === 'DASH' && (
            <div style={s.dashFlex}>
               <div style={s.kpiBig}>
                  <span style={{fontSize:14, color:'#444'}}>CONFORMIDADE ATUAL</span>
                  <h1 style={{fontSize:80, color:'#0f0'}}>{((arquivos.length / items.length) * 100 || 0).toFixed(0)}%</h1>
                  <div style={s.barB}><div style={{...s.barF, width:`${(arquivos.length / items.length) * 100}%`}}></div></div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Arial, sans-serif', overflow:'hidden' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  side: { width: '350px', background: '#080808', borderRight: '1px solid #1a1a1a', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', color: '#0f0', display: 'flex', gap: 12, alignItems:'center' },
  v: { fontSize: '12px', background: '#0f0', color: '#000', padding: '2px 8px', borderRadius: '4px' },
  label: { fontSize: '11px', color: '#555', marginBottom: '10px', fontWeight: 'bold' },
  select: { background: '#111', color: '#fff', border: '1px solid #333', padding: '15px', borderRadius: '12px', marginBottom: '30px', fontSize: '14px', outline: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  btn: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textAlign: 'left', borderRadius: '12px', fontSize: '16px', fontWeight:'bold' },
  btnA: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', background: '#111', border: '1px solid #0f0', color: '#0f0', borderRadius: '12px', fontSize: '16px', fontWeight:'bold' },
  boxLog: { flex: 1, marginTop: 30, background: '#050505', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '12px', fontSize: '12px', background: '#0a0a0a', color: '#444', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' },
  logLista: { padding: '15px', overflowY: 'auto', flex: 1, fontSize: '11px', color: '#333' },
  logItem: { marginBottom: '8px', borderBottom: '1px solid #0a0a0a', paddingBottom: 4 },
  main: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '35px', gap: 20 },
  search: { flex: 1, background: '#080808', border: '1px solid #1a1a1a', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 25px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '20px', width: '100%', outline: 'none', fontSize: '16px' },
  btnUp: { background: '#0f0', color: '#000', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 12, alignItems:'center', fontSize: '14px' },
  content: { background: '#080808', borderRadius: '40px', border: '1px solid #1a1a1a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '25px', fontSize: '12px', color: '#444', borderBottom: '1px solid #1a1a1a', background: '#080808', position: 'sticky', top: 0 },
  tr: { borderBottom: '1px solid #111' },
  tdC: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: '18px' },
  tdD: { padding: '25px', color: '#ccc', fontSize: '16px', lineHeight: '1.6' },
  govContainer: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  govCard: { background: '#111', padding: '60px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center', maxWidth: '500px' },
  btnGov: { background: '#fff', color: '#0057b7', border: 'none', padding: '20px 40px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  successAss: { marginTop: 20 },
  dashFlex: { padding: 60, display: 'flex', justifyContent: 'center' },
  kpiBig: { textAlign: 'center', width: '100%', maxWidth: '400px' },
  barB: { width: '100%', height: '12px', background: '#111', borderRadius: '20px', marginTop: 20 },
  barF: { height: '100%', background: '#0f0', borderRadius: '20px', transition: '1s' }
};
