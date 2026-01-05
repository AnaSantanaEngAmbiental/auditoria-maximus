import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, Mail, Download, 
  FileText, Building, Save, RefreshCw, X, Printer, Eraser, Send
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV65() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', whatsapp: '', responsavel: '' });
  
  // Refs para Assinatura
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      const { data: cadDB } = await supabase.from('unidades_maximus').select('*').eq('id', projeto).single();
      if (cadDB) setCadastro(cadDB);
      
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      setLoading(false);
    }
    load();
  }, [projeto]);

  // --- MOTOR DE ASSINATURA ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f0';
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- MOTOR DE ARQUIVOS ---
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: Date.now() + Math.random() }));
    const lista = [...arquivos, ...novos];
    setArquivos(lista);
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(lista));
  };

  const isValido = (t) => arquivos.some(a => a.nome.includes(String(t).toUpperCase()));

  // --- ENVIO SEMAS ---
  const enviarSemas = () => {
    const subject = encodeURIComponent(`Relatório de Auditoria - ${projeto}`);
    const body = encodeURIComponent(`Prezados SEMAS,\n\nSegue em anexo o relatório técnico da unidade ${projeto}.\nCNPJ: ${cadastro.cnpj}\nResponsável: ${cadastro.responsavel}`);
    window.location.href = `mailto:gestor.semas@exemplo.pa.gov.br?subject=${subject}&body=${body}`;
  };

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={50}/></div>;

  return (
    <div style={s.container}>
      <aside style={s.side} className="no-print">
        <div style={s.brand}><Shield color="#0f0" size={30}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA / FROTA</option>
          <option value="Posto">⛽ POSTO BELÉM</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck/> FROTA / CIPP</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> CADASTRO</button>
          <button onClick={()=>setAba('ASSINA')} style={aba==='ASSINA'?s.btnA:s.btn}><PenTool/> ASSINATURA</button>
        </nav>

        <div style={s.histBox}>
          <div style={s.histHead}>EVIDÊNCIAS ({arquivos.length})</div>
          <div style={s.histList}>
            {arquivos.map(a => <div key={a.id} style={s.histItem}>✓ {a.nome}</div>)}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header} className="no-print">
          <div style={s.search}><Search size={20}/><input placeholder="Buscar..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={enviarSemas} style={s.btnSemas}><Mail size={18}/> ENVIAR SEMAS</button>
             <button onClick={()=>window.print()} style={s.btnLux}><Printer size={18}/> IMPRIMIR</button>
             <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content} id="print-area">
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO (FONTE 20PX)</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
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
              <h1 style={{color:'#0f0'}}>Frota e Equipamentos</h1>
              <div style={s.gridF}>
                {['CIPP', 'CIV', 'ANTT', 'MOPP', 'CRLV', 'LAO'].map(doc => (
                  <div key={doc} style={{...s.cardF, borderColor: isValido(doc)?'#0f0':'#111'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <b style={{fontSize:22}}>{doc}</b>
                      {isValido(doc) ? <CheckCircle color="#0f0"/> : <X color="#f00"/>}
                    </div>
                    <p style={{fontSize:12, color:'#444'}}>Documentação Técnica</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1>Configuração da Unidade</h1>
              <div style={s.grid}>
                <input value={cadastro.cnpj} placeholder="CNPJ" style={s.in} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})}/>
                <input value={cadastro.email} placeholder="E-mail" style={s.in} onChange={e=>setCadastro({...cadastro, email:e.target.value})}/>
                <input value={cadastro.whatsapp} placeholder="WhatsApp" style={s.in} onChange={e=>setCadastro({...cadastro, whatsapp:e.target.value})}/>
                <input value={cadastro.responsavel} placeholder="Auditor" style={s.in} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})}/>
              </div>
              <button onClick={async()=> {await supabase.from('unidades_maximus').upsert({id:projeto, ...cadastro}); alert("✅ SUPABASE OK!")}} style={s.btnSave}><Save/> SALVAR BANCO</button>
            </div>
          )}

          {aba === 'ASSINA' && (
            <div style={s.fullCenter}>
               <div style={s.signBox}>
                  <h2>ASSINATURA DO AUDITOR</h2>
                  <canvas 
                    ref={canvasRef} width={600} height={300} style={s.canvas}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={()=>setIsDrawing(false)}
                  />
                  <div style={{display:'flex', gap:20, marginTop:20}}>
                     <button onClick={clearCanvas} style={s.btnEraser}><Eraser/> LIMPAR</button>
                     <button onClick={()=>alert("Assinatura Salva!")} style={s.btnA}>SALVAR NO RELATÓRIO</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
      <style>{`
        @media print { .no-print { display: none !important; } #print-area { border: none !important; color: black !important; background: white !important; } }
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
  main: { flex: 1, padding: '35px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  search: { flex: 1, background: '#080808', borderRadius: 18, display: 'flex', alignItems: 'center', padding: '0 20px', border:'1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none', fontSize: 16 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10 },
  btnLux: { background: '#fff', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10 },
  btnSemas: { background: '#111', color: '#0f0', border: '1px solid #0f0', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 10 },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: 11, color: '#222' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '25px', color: '#bbb', fontSize: 20, lineHeight: 1.6 },
  pad: { padding: 50 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  in: { background:'#111', border:'1px solid #222', padding:18, borderRadius:15, color:'#fff' },
  btnSave: { background:'#0f0', color:'#000', padding:'18px 30px', borderRadius:15, fontWeight:900, border:'none', marginTop:20, cursor:'pointer' },
  gridF: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:20 },
  cardF: { background:'#080808', padding:25, borderRadius:20, border:'1px solid #111', display:'flex', flexDirection:'column', gap:10 },
  signBox: { textAlign:'center' },
  canvas: { background:'#111', borderRadius:20, border:'2px solid #222', cursor:'crosshair', touchAction:'none' },
  btnEraser: { background:'#300', color:'#f00', padding:'15px 30px', borderRadius:15, fontWeight:900, border:'none', cursor:'pointer', display:'flex', gap:10 },
  fullCenter: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }
};
