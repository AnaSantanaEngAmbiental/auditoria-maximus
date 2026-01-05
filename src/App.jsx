import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, Mail, Download, 
  FileText, Building, Save, RefreshCw, X, Printer, Eraser, QrCode, Cloud
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV68() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', whatsapp: '', responsavel: '', atividade: '' });
  
  const canvasRef = useRef(null);

  // 1. CARREGAMENTO CONSOLIDADO (MULT-EMPRESA)
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function fetchData() {
      setLoading(true);
      
      // Condicionantes Master
      const { data: cond } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (cond) setItems(cond);
      
      // Dados da Empresa Selecionada
      const { data: cadDB } = await supabase.from('unidades_maximus').select('*').eq('id', projeto).single();
      setCadastro(cadDB || { cnpj: '', email: '', whatsapp: '', responsavel: '', atividade: projeto });

      // Buscar Arquivos Vinculados a esta Empresa no Banco
      const { data: arqsDB } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
      setArquivos(arqsDB || []);
      
      setLoading(false);
    }
    fetchData();
  }, [projeto]);

  // 2. MOTOR DE UPLOAD PARA SUPABASE STORAGE
  const handleUploadCloud = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projeto}/${Date.now()}_${file.name}`;
      const filePath = `${fileName}`;

      // A. Upload para o Bucket "maximus_evidencias"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maximus_evidencias')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erro Storage:", uploadError);
        continue;
      }

      // B. Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage.from('maximus_evidencias').getPublicUrl(filePath);

      // C. Registrar no Banco de Dados (auditoria_arquivos)
      const { error: dbError } = await supabase.from('auditoria_arquivos').insert({
        projeto_id: projeto,
        nome_arquivo: file.name.toUpperCase(),
        url_storage: publicUrl,
        codigo_condicionante: file.name.split('.')[0].toUpperCase() // Extrai código do nome do arquivo
      });
    }

    // Atualizar lista local
    const { data: refreshArqs } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
    setArquivos(refreshArqs || []);
    setUploading(false);
    alert("✅ EVIDÊNCIAS SINCRONIZADAS NA NUVEM!");
  };

  const isValido = (codigo) => arquivos.some(a => a.nome_arquivo.includes(String(codigo).toUpperCase()));

  // 3. SUMÁRIO EXECUTIVO DINÂMICO
  const gerarSumario = () => {
    const ok = arquivos.length;
    if (ok === 0) return { msg: "AUDITORIA NÃO INICIADA", cor: "#f00", classe: "CRÍTICO" };
    if (ok < (items.length * 0.5)) return { msg: "PENDÊNCIAS GRAVES", cor: "#f80", classe: "ALTO" };
    return { msg: "UNIDADE EM CONFORMIDADE NÍVEL MAXIMUS", cor: "#0f0", classe: "BAIXO" };
  };

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={40}/> SINCRONIZANDO CLOUD...</div>;

  return (
    <div style={s.container}>
      <aside style={s.side} className="no-print">
        <div style={s.brand}><Shield color="#0f0" size={30}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <label style={s.labelNav}>AUDITORIA ATIVA EM:</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao_Para">⛏️ MINERAÇÃO - PARÁ</option>
          <option value="Logistica_Canaã">🚚 LOGÍSTICA - CANAÃ</option>
          <option value="Posto_Belem">⛽ POSTO - BELÉM</option>
          <option value="Agro_Maraba">🚜 AGRO - MARABÁ</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck/> FROTA / OCR</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> CADASTRO</button>
          <button onClick={()=>setAba('ASSINA')} style={aba==='ASSINA'?s.btnA:s.btn}><PenTool/> ASSINATURA</button>
        </nav>

        <div style={s.histBox}>
          <div style={s.histHead}>NUVEM: {projeto.toUpperCase()}</div>
          <div style={s.histList}>
            {uploading && <div className="animate-pulse" style={{color:'#0f0'}}>☁️ ENVIANDO...</div>}
            {arquivos.map(a => (
              <a key={a.id} href={a.url_storage} target="_blank" rel="noreferrer" style={s.histItem}>
                <Cloud size={10}/> {a.nome_arquivo}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header} className="no-print">
          <div style={s.search}><Search size={20}/><input placeholder="Pesquisar requisito..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={()=>window.print()} style={s.btnLux}><Printer size={18}/> RELATÓRIO PDF</button>
             <label style={s.btnUp}>
               {uploading ? <RefreshCw className="animate-spin"/> : <FilePlus/>} CLOUD UPLOAD 
               <input type="file" multiple hidden onChange={handleUploadCloud}/>
             </label>
          </div>
        </header>

        <div style={s.content} id="print-area">
          {/* SUMÁRIO EXECUTIVO AUTOMÁTICO */}
          <div style={{...s.sumario, borderColor: gerarSumario().cor}}>
             <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                   <h2 style={{margin:0, color:gerarSumario().cor}}>SUMÁRIO EXECUTIVO DE AUDITORIA</h2>
                   <p style={{fontSize:18, margin:'10px 0'}}>STATUS: <b>{gerarSumario().msg}</b></p>
                   <p style={{fontSize:12, color:'#666'}}>Responsável: {cadastro.responsavel} | CNPJ: {cadastro.cnpj}</p>
                </div>
                <div style={s.qrBox}>
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=AUTENTIC_MAXIMUS_${projeto}`} alt="QR" />
                   <span style={s.tagRisco}>RISCO {gerarSumario().classe}</span>
                </div>
             </div>
          </div>

          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO TÉCNICO</th><th style={{textAlign:'center'}}>EVIDÊNCIA CLOUD</th></tr></thead>
                <tbody>
                  {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        {isValido(it.codigo) ? <CheckCircle color="#0f0" size={35}/> : <Camera color="#111" size={35}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0'}}>Configuração de Unidade Cloud</h1>
              <div style={s.grid}>
                <div style={s.field}><label>CNPJ</label><input value={cadastro.cnpj} style={s.in} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})}/></div>
                <div style={s.field}><label>E-MAIL</label><input value={cadastro.email} style={s.in} onChange={e=>setCadastro({...cadastro, email:e.target.value})}/></div>
                <div style={s.field}><label>AUDITOR</label><input value={cadastro.responsavel} style={s.in} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})}/></div>
                <div style={s.field}><label>WHATSAPP</label><input value={cadastro.whatsapp} style={s.in} onChange={e=>setCadastro({...cadastro, whatsapp:e.target.value})}/></div>
              </div>
              <button onClick={async()=> {await supabase.from('unidades_maximus').upsert({id:projeto, ...cadastro}); alert("SINC OK!")}} style={s.btnSave}><Save/> SALVAR EMPRESA</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0', fontWeight:900 },
  side: { width: '360px', background: '#080808', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 22, fontWeight: 900, marginBottom: 30, display:'flex', gap:10 },
  labelNav: { fontSize:9, color:'#444', marginBottom:5, fontWeight:900 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 12, marginBottom: 20 },
  menu: { display:'flex', flexDirection:'column', gap:8 },
  btn: { display:'flex', alignItems:'center', gap:12, padding:16, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold', borderRadius:12 },
  btnA: { display:'flex', alignItems:'center', gap:12, padding:16, background:'#0a0a0a', border:'1px solid #0f0', color:'#0f0', borderRadius:12, fontWeight:'bold' },
  histBox: { flex: 1, marginTop: 20, background: '#020202', borderRadius: 15, border: '1px solid #111', overflow: 'hidden', display:'flex', flexDirection:'column' },
  histHead: { padding: '10px', fontSize: 9, background: '#0a0a0a', color: '#333', textAlign:'center' },
  histList: { padding: 12, overflowY: 'auto', flex: 1, fontSize: 10 },
  histItem: { marginBottom: 5, color: '#0f0', textDecoration:'none', display:'flex', alignItems:'center', gap:5, opacity:0.7 },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', overflow:'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  search: { flex: 1, background: '#080808', borderRadius: 15, display: 'flex', alignItems: 'center', padding: '0 20px', border:'1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 20px', borderRadius: 12, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center' },
  btnLux: { background: '#fff', color: '#000', padding: '12px 20px', borderRadius: 12, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center' },
  content: { background: '#030303', borderRadius: 35, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  sumario: { background:'#080808', margin:25, padding:30, borderRadius:25, borderLeft:'15px solid' },
  qrBox: { textAlign:'right', display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end' },
  tagRisco: { background:'#fff', color:'#000', padding:'5px 12px', borderRadius:8, fontSize:10, fontWeight:900 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px 25px', fontSize: 10, color: '#333' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: 24 },
  tdDesc: { padding: '25px', color: '#ccc', fontSize: 20, lineHeight: 1.5 },
  pad: { padding: 50 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:25 },
  field: { display:'flex', flexDirection:'column', gap:8 },
  in: { background:'#111', border:'1px solid #222', padding:18, borderRadius:12, color:'#fff' },
  btnSave: { background:'#0f0', color:'#000', padding:'18px 40px', borderRadius:12, fontWeight:900, border:'none', marginTop:30, cursor:'pointer' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0' }
};
