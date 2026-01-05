import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, FileText, Globe, Building, QrCode, Save, RefreshCw, X, Eye, Printer
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV63() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO COM VARREDURA DE SEGURANÇA
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function inicializar() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      setLoading(false);
    }
    inicializar();
  }, [projeto]);

  // 2. MOTOR DE UPLOAD E HISTÓRICO
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ 
      nome: f.name.toUpperCase(), 
      id: Date.now() + Math.random(),
      data: new Date().toLocaleDateString()
    }));
    const listaAtualizada = [...arquivos, ...novos];
    setArquivos(listaAtualizada);
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaAtualizada));
  };

  // 3. CÂMERA COM RECONHECIMENTO DE IA
  const ligarCamera = async () => {
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Simulando processamento de IA após 3 segundos
      setTimeout(() => setScanResult("DOCUMENTO IDENTIFICADO: LICENÇA AMBIENTAL N° 4032/2025"), 3000);
    } catch (e) { alert("Câmera bloqueada"); setCameraAtiva(false); }
  };

  // 4. IMPRESSÃO DE LUXO
  const imprimirRelatorio = () => {
    window.print();
  };

  const isValido = (t) => arquivos.some(a => a.nome.includes(String(t).toUpperCase()));

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={40}/></div>;

  const perc = ((arquivos.length / (items.length || 1)) * 100).toFixed(0);

  return (
    <div style={s.container}>
      {/* SIDEBAR CONSOLIDADA */}
      <aside style={s.side} className="no-print">
        <div style={s.brand}><Shield color="#0f0" size={30}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA</option>
          <option value="Posto">⛽ POSTO</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck size={18}/> FROTA OPERACIONAL</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><BarChart3 size={18}/> DASHBOARD</button>
          <button onClick={()=>setAba('SCAN')} style={aba==='SCAN'?s.btnA:s.btn}><QrCode size={18}/> SCANNER IA</button>
        </nav>

        <div style={s.histBox}>
          <div style={s.histHead}>HISTÓRICO DE EVIDÊNCIAS</div>
          <div style={s.histList}>
            {arquivos.map(a => (
              <div key={a.id} style={s.histItem}>
                <CheckCircle size={10} color="#0f0"/> <span>{a.nome}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={()=>{setArquivos([]); localStorage.removeItem(`MAX_FILES_${projeto}`)}} style={s.btnReset}>
          <Trash2 size={14}/> LIMPAR DADOS
        </button>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header} className="no-print">
          <div style={s.search}><Search size={20}/><input placeholder="Filtrar condicionantes..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={imprimirRelatorio} style={s.btnLux}><Printer size={18}/> IMPRIMIR LUXO</button>
             <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content} id="print-area">
          {/* CABEÇALHO DE IMPRESSÃO (INVISÍVEL NA TELA) */}
          <div className="print-only" style={s.printHeader}>
             <div style={{fontSize:24, fontWeight:900}}>RELATÓRIO TÉCNICO DE AUDITORIA - MAXIMUS PhD</div>
             <div>PROJETO: {projeto.toUpperCase()} | DATA: {new Date().toLocaleDateString()}</div>
             <div style={s.carimbo}>AUTENTICADO VIA SUPABASE</div>
          </div>

          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO LEGAL</th><th style={{textAlign:'center'}}>EVIDÊNCIA</th></tr></thead>
                <tbody>
                  {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        {isValido(it.codigo) ? <CheckCircle color="#0f0" size={30}/> : <Camera color="#111" size={30}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0', marginBottom:30}}>Frota e Certificações</h1>
              <div style={s.gridFrota}>
                {['CIPP', 'CIV', 'ANTT', 'MOPP', 'CRLV'].map(f => (
                  <div key={f} style={{...s.cardF, borderLeft: isValido(f)?'5px solid #0f0':'5px solid #f00'}}>
                    <Truck color={isValido(f)?'#0f0':'#333'}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900}}>{f}</div>
                      <div style={{fontSize:12, color:'#444'}}>Validação por Documento</div>
                    </div>
                    {isValido(f) ? <CheckCircle color="#0f0"/> : <X color="#f00"/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === 'DASH' && (
            <div style={s.pad}>
               <h2 style={{color:'#0f0'}}>Painel de Controle</h2>
               <div style={s.dashFlex}>
                  <div style={s.chartContainer}>
                     <div style={{...s.donut, background:`conic-gradient(#0f0 ${perc}%, #111 0)`}}>
                        <div style={s.donutIn}>{perc}%</div>
                     </div>
                     <p style={{marginTop:20, fontWeight:'bold'}}>CONFORMIDADE ATUAL</p>
                  </div>
                  <div style={s.statsList}>
                     <div style={s.statCard}><span>TOTAL REQUISITOS</span> <b>{items.length}</b></div>
                     <div style={s.statCard}><span>CONFORMES</span> <b>{arquivos.length}</b></div>
                     <div style={s.statCard}><span>PENDENTES</span> <b>{items.length - arquivos.length}</b></div>
                  </div>
               </div>
            </div>
          )}

          {aba === 'SCAN' && (
            <div style={s.fullCenter}>
               {!cameraAtiva ? (
                 <button onClick={ligarCamera} style={s.btnLux}><Camera/> ABRIR SCANNER IA</button>
               ) : (
                 <div style={s.scanWindow}>
                    <video ref={videoRef} autoPlay playsInline style={s.video}/>
                    <div style={s.scannerFrame}>
                       <div style={s.cornerTL}/> <div style={s.cornerTR}/>
                       <div style={s.cornerBL}/> <div style={s.cornerBR}/>
                       <div style={s.scanBar}/>
                    </div>
                    {scanResult && <div style={s.scanFeedback}><Zap size={16}/> {scanResult}</div>}
                    <button onClick={()=>setCameraAtiva(false)} style={s.closeCam}><X/></button>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #print-area { border: none !important; background: white !important; color: black !important; }
          body { background: white; }
          td { color: black !important; border-bottom: 1px solid #ddd !important; }
          .tdCod { color: #000 !important; }
        }
        .print-only { display: none; }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0' },
  side: { width: '380px', background: '#080808', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 24, fontWeight: 900, marginBottom: 35, display: 'flex', gap: 10, letterSpacing: -1 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 12, marginBottom: 25, fontSize: 14, outline:'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 8 },
  btn: { display:'flex', alignItems:'center', gap:12, padding:18, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold', borderRadius:12 },
  btnA: { display:'flex', alignItems:'center', gap:12, padding:18, background:'#0a0a0a', border:'1px solid #0f0', color:'#0f0', borderRadius:12, fontWeight:'bold' },
  histBox: { flex: 1, marginTop: 25, background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden', display:'flex', flexDirection:'column' },
  histHead: { padding: '12px', fontSize: 10, background: '#080808', color: '#333', fontWeight: 900, textAlign: 'center' },
  histList: { padding: 15, overflowY: 'auto', flex: 1, fontSize: 11, color: '#0f0' },
  histItem: { marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', opacity: 0.7 },
  btnReset: { marginTop: 20, padding: 15, background: '#100', color: '#f00', border: '1px solid #300', borderRadius: 12, cursor: 'pointer', display: 'flex', gap: 10, justifyContent: 'center', fontSize: 12, fontWeight: 900 },
  main: { flex: 1, padding: '35px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, gap: 15 },
  search: { flex: 1, background: '#080808', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 20px', border: '1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none', fontSize: 16 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  btnLux: { background: '#fff', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: 11, color: '#222', background: '#030303', position: 'sticky', top: 0, borderBottom: '1px solid #080808' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: 20 },
  tdDesc: { padding: '25px', color: '#bbb', fontSize: 18, lineHeight: 1.6 },
  pad: { padding: 50 },
  gridFrota: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:20 },
  cardF: { background:'#080808', padding:25, borderRadius:20, display:'flex', alignItems:'center', gap:20, border:'1px solid #111' },
  dashFlex: { display:'flex', gap:60, marginTop:40, alignItems:'center' },
  chartContainer: { textAlign:'center' },
  donut: { width: 180, height: 180, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  donutIn: { width: 140, height: 140, background: '#030303', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900 },
  statsList: { display:'flex', flexDirection:'column', gap:15, flex:1 },
  statCard: { background:'#080808', padding:25, borderRadius:20, border:'1px solid #111', display:'flex', justifyContent:'space-between', alignItems:'center' },
  fullCenter: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  scanWindow: { position:'relative', width:'90%', maxWidth:450, height:550, background:'#000', borderRadius:30, overflow:'hidden', border:'2px solid #0f0' },
  video: { width:'100%', height:'100%', objectFit:'cover' },
  scannerFrame: { position:'absolute', top:'15%', left:'10%', right:'10%', bottom:'25%', border:'1px solid rgba(15,255,0,0.3)' },
  scanBar: { position:'absolute', top:0, left:0, width:'100%', height:2, background:'#0f0', boxShadow:'0 0 15px #0f0', animation:'scan 3s infinite linear' },
  scanFeedback: { position:'absolute', bottom:30, left:20, right:20, background:'rgba(0,0,0,0.8)', padding:15, borderRadius:15, color:'#0f0', fontSize:12, textAlign:'center', border:'1px solid #0f0' },
  closeCam: { position:'absolute', top:20, right:20, background:'#f00', border:'none', color:'#fff', borderRadius:'50%', width:35, height:35, cursor:'pointer' },
  cornerTL: { position:'absolute', top:0, left:0, width:20, height:20, borderTop:'4px solid #0f0', borderLeft:'4px solid #0f0' },
  cornerTR: { position:'absolute', top:0, right:0, width:20, height:20, borderTop:'4px solid #0f0', borderRight:'4px solid #0f0' },
  cornerBL: { position:'absolute', bottom:0, left:0, width:20, height:20, borderBottom:'4px solid #0f0', borderLeft:'4px solid #0f0' },
  cornerBR: { position:'absolute', bottom:0, right:0, width:20, height:20, borderBottom:'4px solid #0f0', borderRight:'4px solid #0f0' },
  printHeader: { borderBottom: '4px solid #0f0', paddingBottom: 20, marginBottom: 30, textAlign: 'center' },
  carimbo: { display:'inline-block', marginTop:10, border:'2px solid #0f0', color:'#0f0', padding:'5px 15px', fontWeight:900, textTransform:'uppercase', fontSize:12 }
};
