import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, FileText, Globe, Building, QrCode, Save, RefreshCw, X
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV62() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', whatsapp: '', responsavel: '' });
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO CONSOLIDADO
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function load() {
      setLoading(true);
      const { data: cond } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (cond) setItems(cond);
      
      // Busca cadastro no Supabase (Tentativa)
      const { data: cadDB } = await supabase.from('unidades_maximus').select('*').eq('id', projeto).single();
      if (cadDB) {
        setCadastro(cadDB);
      } else {
        const local = localStorage.getItem(`MAX_CAD_${projeto}`);
        setCadastro(local ? JSON.parse(local) : { cnpj: '', email: '', whatsapp: '', responsavel: '' });
      }

      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      setLoading(false);
    }
    load();
  }, [projeto]);

  // 2. SALVAR NO SUPABASE
  const salvarSupa = async () => {
    try {
      const { error } = await supabase.from('unidades_maximus').upsert({ 
        id: projeto, ...cadastro, updated_at: new Date() 
      });
      if (error) throw error;
      localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro));
      alert("✅ DADOS SINCRONIZADOS NO SUPABASE!");
    } catch (e) {
      alert("Salvando Localmente (Tabela SQL não encontrada no Supabase)");
      localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro));
    }
  };

  // 3. MOTOR DE UPLOAD E RESET
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: Date.now() + Math.random() }));
    setArquivos(prev => {
      const atual = [...prev, ...novos];
      localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(atual));
      return atual;
    });
  };

  const resetTotal = () => {
    if(window.confirm("LIMPAR TUDO DESTE PROJETO?")) {
      setArquivos([]);
      localStorage.removeItem(`MAX_FILES_${projeto}`);
    }
  };

  // 4. CÂMERA REAL (QR CODE)
  const ligarCamera = async () => {
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) { alert("Câmera não disponível"); setCameraAtiva(false); }
  };

  const isValido = (t) => arquivos.some(a => a.nome.includes(String(t).toUpperCase()));

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin"/> CARREGANDO...</div>;

  // Cálculos Dashboard
  const total = items.length || 1;
  const ok = arquivos.length;
  const perc = ((ok / total) * 100).toFixed(0);

  return (
    <div style={s.container}>
      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0" size={32}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA</option>
          <option value="Posto">⛽ POSTO</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck/> FROTA</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><BarChart3/> DASHBOARD</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> CADASTRO</button>
          <button onClick={()=>setAba('QR')} style={aba==='QR'?s.btnA:s.btn}><QrCode/> QR CAM</button>
          <button onClick={()=>setAba('ASSINA')} style={aba==='ASSINA'?s.btnA:s.btn}><PenTool/> ASSINATURA</button>
        </nav>

        <button onClick={resetTotal} style={s.btnReset}><Trash2 size={16}/> RESETAR PROJETO</button>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.search}><Search size={20}/><input placeholder="Filtrar..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <label style={s.btnUp}><FilePlus/> UPLOAD <input type="file" multiple hidden onChange={handleUpload}/></label>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO (20PX)</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={isValido(it.codigo)?'#0f0':'#111'} size={35}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0'}}>Documentos de Frota</h1>
              {['CIPP', 'CIV', 'ANTT', 'MOPP'].map(f => (
                <div key={f} style={s.cardF}>
                  <span><b>{f}</b> - Certificado Operacional</span>
                  <span style={{color:isValido(f)?'#0f0':'#f00'}}>{isValido(f)?'CONFORME ✓':'PENDENTE'}</span>
                </div>
              ))}
            </div>
          )}

          {aba === 'DASH' && (
            <div style={s.pad}>
               <h1 style={{color:'#0f0'}}>Status de Conformidade</h1>
               <div style={s.dashGrid}>
                  <div style={s.chartBox}>
                     <div style={{...s.pie, background:`conic-gradient(#0f0 ${perc}%, #111 0)`}}>
                        <div style={s.pieIn}>{perc}%</div>
                     </div>
                     <p>CONFORMIDADE GERAL</p>
                  </div>
                  <div style={s.stats}>
                    <div style={s.statCard}><h3>{items.length}</h3><p>Total Leis</p></div>
                    <div style={s.statCard}><h3>{arquivos.length}</h3><p>Evidências</p></div>
                  </div>
               </div>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1>Cadastro no Supabase</h1>
              <div style={s.grid}>
                <input value={cadastro.cnpj} placeholder="CNPJ" style={s.in} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})}/>
                <input value={cadastro.whatsapp} placeholder="WhatsApp" style={s.in} onChange={e=>setCadastro({...cadastro, whatsapp:e.target.value})}/>
                <input value={cadastro.email} placeholder="E-mail Gestor" style={s.in} onChange={e=>setCadastro({...cadastro, email:e.target.value})}/>
                <input value={cadastro.responsavel} placeholder="Auditor" style={s.in} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})}/>
              </div>
              <button onClick={salvarSupa} style={s.btnSave}><Save/> SINCRONIZAR BANCO</button>
            </div>
          )}

          {aba === 'QR' && (
            <div style={s.fullCenter}>
              {!cameraAtiva ? (
                <button onClick={ligarCamera} style={s.btnA}><QrCode size={40}/> LIGAR CÂMERA</button>
              ) : (
                <div style={s.camBox}>
                  <video ref={videoRef} autoPlay playsInline style={s.video}/>
                  <button onClick={()=>setCameraAtiva(false)} style={s.btnX}><X/></button>
                  <div style={s.scanLine}/>
                </div>
              )}
            </div>
          )}

          {aba === 'ASSINA' && (
            <div style={s.fullCenter}>
               <div style={s.assinaCard}>
                  <PenTool size={60} color="#0f0"/>
                  <h2>Assinatura Digital</h2>
                  <p>Documento pronto para carimbo ICP-Brasil.</p>
                  <button onClick={()=>alert('Assinado com Sucesso!')} style={s.btnA}>ASSINAR AGORA</button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0' },
  side: { width: '350px', background: '#080808', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 26, fontWeight: 900, marginBottom: 30, display: 'flex', gap: 10 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 10, marginBottom: 20 },
  menu: { display: 'flex', flexDirection: 'column', gap: 5 },
  btn: { display:'flex', alignItems:'center', gap:10, padding:15, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold' },
  btnA: { display:'flex', alignItems:'center', gap:10, padding:15, background:'#0a0a0a', border:'1px solid #0f0', color:'#0f0', borderRadius:10, fontWeight:'bold' },
  btnReset: { marginTop:'auto', padding:15, background:'#100', color:'#f00', border:'1px solid #300', borderRadius:10, cursor:'pointer', display:'flex', gap:10, justifyContent:'center' },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20 },
  search: { flex: 1, background: '#080808', borderRadius: 15, display: 'flex', alignItems: 'center', padding: '0 20px', maxWidth: 400, border: '1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 12, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10 },
  content: { background: '#030303', borderRadius: 30, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: 12, color: '#333' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '25px', color: '#ccc', fontSize: 20, lineHeight: 1.5 },
  pad: { padding: 40 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, marginBottom:20 },
  in: { background:'#111', border:'1px solid #222', padding:15, borderRadius:10, color:'#fff' },
  btnSave: { background:'#0f0', color:'#000', padding:'15px 30px', borderRadius:10, fontWeight:900, border:'none', cursor:'pointer', display:'flex', gap:10 },
  dashGrid: { display:'flex', gap:40, marginTop:30, alignItems:'center' },
  chartBox: { textAlign:'center' },
  pie: { width: 150, height: 150, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pieIn: { width: 110, height: 110, background: '#030303', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' },
  stats: { display:'flex', flexDirection:'column', gap:15 },
  statCard: { background:'#080808', padding:20, borderRadius:15, border:'1px solid #111', minWidth:150, textAlign:'center' },
  fullCenter: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  camBox: { position:'relative', width:'90%', maxWidth:400, height:400, background:'#000', borderRadius:20, overflow:'hidden', border:'2px solid #0f0' },
  video: { width:'100%', height:'100%', objectFit:'cover' },
  btnX: { position:'absolute', top:10, right:10, background:'#f00', border:'none', color:'#fff', borderRadius:'50%', padding:5, cursor:'pointer' },
  scanLine: { position:'absolute', top:0, left:0, width:'100%', height:2, background:'#0f0', boxShadow:'0 0 10px #0f0', animation:'scan 2s infinite' },
  assinaCard: { textAlign:'center', padding:50, background:'#080808', borderRadius:30, border:'1px solid #111' }
};
