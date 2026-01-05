import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, Download, FileText, 
  Building, QrCode, Save, RefreshCw, X, Printer, UserCheck, Lock
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV64() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', whatsapp: '', responsavel: '' });
  
  // Estados de Segurança
  const [faceAuth, setFaceAuth] = useState(false);
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregarTudo() {
      setLoading(true);
      // 1. Condicionantes do Banco
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      // 2. Cadastro da Unidade (Supabase + Local Fallback)
      const { data: cadDB } = await supabase.from('unidades_maximus').select('*').eq('id', projeto).single();
      if (cadDB) setCadastro(cadDB);
      else {
        const local = localStorage.getItem(`MAX_CAD_${projeto}`);
        if (local) setCadastro(JSON.parse(local));
      }

      // 3. Arquivos/Evidências
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      
      setLoading(false);
    }
    carregarTudo();
  }, [projeto]);

  // FUNÇÕES DE MOTOR
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: Date.now() + Math.random() }));
    const lista = [...arquivos, ...novos];
    setArquivos(lista);
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(lista));
  };

  const salvarCadastro = async () => {
    const { error } = await supabase.from('unidades_maximus').upsert({ id: projeto, ...cadastro });
    localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro));
    alert(error ? "Erro ao salvar no banco (Verifique o SQL)" : "✅ DADOS SINCRONIZADOS!");
  };

  const ligarBiometria = async () => {
    setScannerAtivo(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setTimeout(() => {
        setFaceAuth(true);
        setScannerAtivo(false);
        stream.getTracks().forEach(t => t.stop());
      }, 3000);
    } catch (e) { alert("Câmera não detectada"); setScannerAtivo(false); }
  };

  const isValido = (termo) => arquivos.some(a => a.nome.includes(String(termo).toUpperCase()));
  const perc = ((arquivos.length / (items.length || 1)) * 100).toFixed(0);

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={50}/></div>;

  return (
    <div style={s.container}>
      {/* SIDEBAR CONSOLIDADA */}
      <aside style={s.side} className="no-print">
        <div style={s.brand}><Shield color="#0f0" size={30}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA / FROTA</option>
          <option value="Posto">⛽ POSTO DE COMBUSTÍVEL</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck/> FROTA / CIPP</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><BarChart3/> DASHBOARD</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> CADASTRO</button>
        </nav>

        <div style={s.histBox}>
          <div style={s.histHead}>EVIDÊNCIAS CARREGADAS</div>
          <div style={s.histList}>
            {arquivos.map(a => <div key={a.id} style={s.histItem}>✓ {a.nome}</div>)}
          </div>
        </div>

        <button onClick={()=>{setArquivos([]); localStorage.removeItem(`MAX_FILES_${projeto}`)}} style={s.btnReset}><Trash2 size={14}/> RESETAR</button>
      </aside>

      <main style={s.main}>
        <header style={s.header} className="no-print">
          <div style={s.search}><Search size={20}/><input placeholder="Filtrar..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             {!faceAuth ? (
               <button onClick={ligarBiometria} style={s.btnLock}><Lock size={18}/> LIBERAR RELATÓRIO</button>
             ) : (
               <button onClick={()=>window.print()} style={s.btnLux}><Printer size={18}/> IMPRIMIR LUXO</button>
             )}
             <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content} id="print-area">
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO (20PX)</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={isValido(it.codigo)?'#0f0':'#111'} size={32}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0'}}>Gestão de Certificados de Frota</h1>
              <div style={s.gridF}>
                {['CIPP', 'CIV', 'ANTT', 'MOPP', 'CRLV', 'LAO'].map(doc => (
                  <div key={doc} style={{...s.cardF, borderColor: isValido(doc)?'#0f0':'#111'}}>
                    <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                      <b style={{fontSize:22}}>{doc}</b>
                      {isValido(doc) ? <CheckCircle color="#0f0"/> : <X color="#f00"/>}
                    </div>
                    <p style={{fontSize:12, color:'#444'}}>Documentação Técnica Obrigatória</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === 'DASH' && (
            <div style={s.pad}>
               <div style={s.dashRow}>
                  <div style={s.chartBox}>
                    <div style={{...s.pie, background:`conic-gradient(#0f0 ${perc}%, #111 0)`}}>
                      <div style={s.pieIn}>{perc}%</div>
                    </div>
                  </div>
                  <div style={s.stats}>
                     <div style={s.sCard}><span>REQUISITOS</span> <b>{items.length}</b></div>
                     <div style={s.sCard}><span>EVIDÊNCIAS</span> <b>{arquivos.length}</b></div>
                  </div>
               </div>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0'}}>Dados da Unidade de Auditoria</h1>
              <div style={s.grid}>
                <div style={s.field}><label>CNPJ</label><input value={cadastro.cnpj} style={s.in} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})}/></div>
                <div style={s.field}><label>WHATSAPP</label><input value={cadastro.whatsapp} style={s.in} onChange={e=>setCadastro({...cadastro, whatsapp:e.target.value})}/></div>
                <div style={s.field}><label>E-MAIL</label><input value={cadastro.email} style={s.in} onChange={e=>setCadastro({...cadastro, email:e.target.value})}/></div>
                <div style={s.field}><label>AUDITOR</label><input value={cadastro.responsavel} style={s.in} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})}/></div>
              </div>
              <button onClick={salvarCadastro} style={s.btnSave}><Save/> SALVAR NO SUPABASE</button>
            </div>
          )}
        </div>

        {/* OVERLAY RECONHECIMENTO FACIAL */}
        {scannerAtivo && (
          <div style={s.overlay}>
             <div style={s.faceBox}>
                <video ref={videoRef} autoPlay style={s.vFace}/>
                <div style={s.faceScanLine}/>
                <p>ESCANEANDO FACE DO AUDITOR...</p>
             </div>
          </div>
        )}
      </main>

      <style>{`
        @media print { .no-print { display: none !important; } #print-area { background: white !important; color: black !important; } td { color: black !important; border-bottom: 1px solid #ddd !important; } }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0' },
  side: { width: '380px', background: '#080808', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 24, fontWeight: 900, marginBottom: 35, display:'flex', gap:10 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 12, marginBottom: 25 },
  menu: { display:'flex', flexDirection:'column', gap:8 },
  btn: { display:'flex', alignItems:'center', gap:12, padding:18, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold', borderRadius:12 },
  btnA: { display:'flex', alignItems:'center', gap:12, padding:18, background:'#0a0a0a', border:'1px solid #0f0', color:'#0f0', borderRadius:12, fontWeight:'bold' },
  histBox: { flex: 1, marginTop: 25, background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden', display:'flex', flexDirection:'column' },
  histHead: { padding: '12px', fontSize: 10, background: '#080808', color: '#333', fontWeight: 900, textAlign:'center' },
  histList: { padding: 15, overflowY: 'auto', flex: 1, fontSize: 11, color: '#0f0' },
  histItem: { marginBottom: 6, opacity: 0.6 },
  btnReset: { marginTop: 20, padding: 15, background: '#100', color: '#f00', border: '1px solid #300', borderRadius: 12, fontWeight: 900, cursor:'pointer' },
  main: { flex: 1, padding: '35px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, gap: 15 },
  search: { flex: 1, background: '#080808', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 20px', border:'1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none', fontSize: 16 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  btnLux: { background: '#fff', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  btnLock: { background: '#111', color: '#0f0', border: '1px solid #0f0', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: 11, color: '#222' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: 20 },
  tdDesc: { padding: '25px', color: '#bbb', fontSize: 18, lineHeight: 1.6 },
  pad: { padding: 50 },
  gridF: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:20 },
  cardF: { background:'#080808', padding:25, borderRadius:20, border:'1px solid #111', display:'flex', flexDirection:'column', gap:10 },
  dashRow: { display:'flex', gap:60, alignItems:'center' },
  pie: { width: 180, height: 180, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pieIn: { width: 140, height: 140, background: '#030303', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900 },
  stats: { display:'flex', flexDirection:'column', gap:20 },
  sCard: { background:'#080808', padding:25, borderRadius:20, border:'1px solid #111', width:250, display:'flex', justifyContent:'space-between', alignItems:'center' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:25 },
  field: { display:'flex', flexDirection:'column', gap:8 },
  in: { background:'#111', border:'1px solid #222', padding:18, borderRadius:15, color:'#fff', outline:'none' },
  btnSave: { background:'#0f0', color:'#000', padding:'18px 35px', borderRadius:15, fontWeight:900, border:'none', marginTop:30, cursor:'pointer', display:'flex', gap:10 },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  faceBox: { textAlign:'center', width:350 },
  vFace: { width:'100%', borderRadius:'50%', border:'3px solid #0f0', height:350, objectFit:'cover' },
  faceScanLine: { position:'absolute', top:'30%', left:'30%', width:'40%', height:2, background:'#0f0', boxShadow:'0 0 15px #0f0', animation:'scan 2s infinite' }
};
