import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, 
  FilePlus, History, Save, Building2, Map, Scale, Download,
  Wifi, Zap, Cpu, Activity, Info, MapPin, BarChart3
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV52() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO E SINCRONIA DE DADOS E LOGS
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function init() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      setArquivos(JSON.parse(localStorage.getItem(`MAX_FILES_${projeto}`) || '[]'));
      setLogs(JSON.parse(localStorage.getItem(`MAX_LOGS_${projeto}`) || '[]'));
      setLoading(false);
    }
    init();
  }, [projeto]);

  // 2. REGISTRO DE LOGS (Funcionalidade #21)
  const addLog = (acao) => {
    const novoLog = {
      id: Date.now(),
      texto: acao,
      hora: new Date().toLocaleTimeString('pt-BR'),
      data: new Date().toLocaleDateString('pt-BR')
    };
    const atualizados = [novoLog, ...logs].slice(0, 50); // Mantém os últimos 50 logs
    setLogs(atualizados);
    localStorage.setItem(`MAX_LOGS_${projeto}`, JSON.stringify(atualizados));
  };

  // 3. UPLOAD COM FIX DE CACHE E LOG
  const processarUpload = (files) => {
    if (!files || files.length === 0) return;
    const novosDocs = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleDateString('pt-BR')
    }));

    setArquivos(prev => {
      const nomes = new Set(prev.map(a => a.nome));
      const filtrados = novosDocs.filter(n => !nomes.has(n.nome));
      if(filtrados.length > 0) addLog(`Upload de ${filtrados.length} documento(s)`);
      const lista = [...prev, ...filtrados];
      localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(lista));
      return lista;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validar = (id) => {
    const nomes = arquivos.map(a => a.nome);
    const regras = { CIPP: /\b(CIPP|5\.1)\b/, CIV: /\b(CIV|3\.1)\b/, MOPP: /\b(MOPP|CNH)\b/ };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  };

  if (loading) return <div style={s.load}><Zap className="animate-pulse" size={40}/></div>;

  return (
    <div style={s.body} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); processarUpload(e.dataTransfer.files)}}>
      
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS <span style={s.v}>v52</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ Mineração Parauapebas</option>
          <option value="Logistica">🚚 Logística Barcarena</option>
          <option value="Posto">⛽ Postos Belém</option>
        </select>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> Auditoria</button>
          <button onClick={()=>setAba('MAPA')} style={aba==='MAPA'?s.btnA:s.btn}><MapPin size={18}/> Mapa de Calor PA</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><BarChart3 size={18}/> Dashboard</button>
        </nav>

        {/* LOG DE ALTERAÇÕES (#21) */}
        <div style={s.boxLog}>
          <div style={s.boxHead}>LOG DE ATIVIDADES</div>
          <div style={s.logLista}>
            {logs.map(l => (
              <div key={l.id} style={s.logItem}>
                <Activity size={10} color="#555"/> {l.hora} - {l.texto}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18}/><input placeholder="Filtrar condicionantes..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <label style={s.btnUp}>
            <FilePlus size={18}/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={e=>processarUpload(e.target.files)}/>
          </label>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it,i)=>(
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={validar(it.codigo)?'#0f0':'#111'} size={24}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'MAPA' && (
            <div style={s.mapContainer}>
               <h3 style={{color:'#0f0', marginBottom:20}}>Focos de Irregularidade Ambiental - Estado do Pará</h3>
               <div style={s.mapFlex}>
                  <div style={s.mapStatic}>
                    {/* Simulação de Pontos no Mapa */}
                    <div style={{...s.dot, top:'40%', left:'60%', background:'#f00'}}></div>
                    <div style={{...s.dot, top:'80%', left:'70%', background:'#ff0'}}></div>
                    <div style={{...s.dot, top:'20%', left:'30%', background:'#0f0'}}></div>
                    <p style={{marginTop:180, color:'#444'}}>Interface Cartográfica SEMAS/PA Ativa</p>
                  </div>
                  <div style={s.mapLegend}>
                    <div style={s.legItem}><div style={{...s.colorB, background:'#f00'}}></div> CRÍTICO (Barcarena)</div>
                    <div style={s.legItem}><div style={{...s.colorB, background:'#ff0'}}></div> ALERTA (Parauapebas)</div>
                    <div style={s.legItem}><div style={{...s.colorB, background:'#0f0'}}></div> OK (Belém)</div>
                  </div>
               </div>
            </div>
          )}

          {aba === 'DASH' && (
            <div style={s.dashGrid}>
              <div style={s.kpiCard}>
                <span>CONFORMIDADE GERAL</span>
                <h2>{((arquivos.length / items.length) * 100 || 0).toFixed(1)}%</h2>
                <div style={s.barBack}><div style={{...s.barFront, width: `${(arquivos.length / items.length) * 100}%`}}></div></div>
              </div>
              <div style={s.kpiCard}>
                <span>DOCUMENTOS CARREGADOS</span>
                <h2>{arquivos.length}</h2>
                <p>Total de {items.length} requisitos</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow:'hidden' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0', background: '#000' },
  side: { width: '320px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '30px', color: '#0f0', display: 'flex', gap: 10 },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 5px', borderRadius: '4px' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '10px', marginBottom: '25px', outline: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
  btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '10px' },
  boxLog: { flex: 1, marginTop: 25, background: '#020202', borderRadius: '15px', border: '1px solid #111', overflow: 'hidden', display:'flex', flexDirection:'column' },
  boxHead: { padding: '10px', fontSize: '10px', background:'#080808', color: '#444', textAlign:'center', fontWeight:'bold' },
  logLista: { padding: '10px', overflowY: 'auto', flex: 1 },
  logItem: { fontSize: '9px', color: '#555', marginBottom: '6px', borderBottom: '1px solid #080808', paddingBottom: 4, display:'flex', gap:5, alignItems:'center' },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: 20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  content: { background: '#050505', borderRadius: '30px', border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', background:'#050505', position:'sticky', top:0 },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdD: { padding: '20px', color: '#888', fontSize: '13px', lineHeight: '1.6' },
  mapContainer: { padding: 40 },
  mapFlex: { display:'flex', gap:40, alignItems:'center' },
  mapStatic: { width: '300px', height: '200px', background: '#080808', borderRadius: '20px', border: '1px solid #111', position: 'relative', textAlign:'center' },
  dot: { position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', boxShadow: '0 0 10px currentColor' },
  mapLegend: { display:'flex', flexDirection:'column', gap:15 },
  legItem: { display:'flex', alignItems:'center', gap:10, fontSize:'12px', color:'#666' },
  colorB: { width: 12, height: 12, borderRadius: 2 },
  dashGrid: { display:'grid', gridTemplateColumns: '1fr 1fr', gap: 30, padding: 40 },
  kpiCard: { background: '#0a0a0a', padding: 30, borderRadius: '25px', border: '1px solid #111' },
  barBack: { width: '100%', height: 6, background: '#111', borderRadius: 10, marginTop: 15 },
  barFront: { height: '100%', background: '#0f0', borderRadius: 10, transition: '0.5s' }
};
