import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MapPin, 
  Building, Save, RefreshCw, X, Printer, Eraser, QrCode, Cloud, Globe, AlertCircle
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV70() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao_PA');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [geo, setGeo] = useState({ lat: '', lng: '' });
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', responsavel: '', whatsapp: '' });
  
  // 1. CARREGAMENTO SINCRONIZADO 100% SUPABASE
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function fetchCloudData() {
      setLoading(true);
      
      // A. Buscar Condicionantes Master (Base de Leis)
      const { data: cond } = await supabase.from('base_condicionantes').select('*').order('codigo');
      setItems(cond || []);
      
      // B. Buscar Dados da Empresa e GPS
      const { data: cadDB } = await supabase.from('unidades_maximus').select('*').eq('id', projeto).single();
      if (cadDB) {
        setCadastro({ cnpj: cadDB.cnpj, email: cadDB.email, responsavel: cadDB.responsavel, whatsapp: cadDB.whatsapp });
        setGeo({ lat: cadDB.latitude, lng: cadDB.longitude });
      }

      // C. Buscar Evidências do Cloud Storage
      const { data: arqsDB } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
      setArquivos(arqsDB || []);
      
      setLoading(false);
    }
    fetchCloudData();
  }, [projeto]);

  // 2. CAPTURA DE GPS AUTOMÁTICA
  const capturarPosicao = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      setGeo({ lat, lng });
    });
  };

  // 3. UPLOAD PARA CLOUD STORAGE COM VÍNCULO AO ITEM
  const handleUploadCloud = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    for (const file of files) {
      const codigoExtraido = file.name.split('.')[0].toUpperCase();
      const filePath = `${projeto}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage.from('maximus_evidencias').upload(filePath, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('maximus_evidencias').getPublicUrl(filePath);
        // Registrar na tabela de arquivos
        await supabase.from('auditoria_arquivos').insert({
          projeto_id: projeto,
          nome_arquivo: file.name.toUpperCase(),
          url_storage: publicUrl,
          codigo_condicionante: codigoExtraido
        });
        // Atualizar status na tabela de itens
        await supabase.from('auditoria_itens').upsert({
          projeto_id: projeto,
          codigo_item: codigoExtraido,
          conformidade: true,
          updated_at: new Date()
        });
      }
    }
    // Refresh da lista
    const { data: refresh } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
    setArquivos(refresh || []);
    setUploading(false);
  };

  const isValido = (cod) => arquivos.some(a => a.codigo_condicionante === String(cod).toUpperCase());

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={40}/> SINCRONIZANDO COM A NUVEM...</div>;

  return (
    <div style={s.container}>
      <aside style={s.side} className="no-print">
        <div style={s.brand}><Shield color="#0f0" size={30}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <label style={s.labelNav}>UNIDADE ATIVA:</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao_PA">⛏️ MINERAÇÃO PARÁ</option>
          <option value="Logistica_Canaa">🚚 LOGÍSTICA CANAÃ</option>
          <option value="Posto_Belem">⛽ POSTO BELÉM</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('DASHBOARD')} style={aba==='DASHBOARD'?s.btnA:s.btn}><BarChart3/> DASHBOARD</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> CADASTRO</button>
          <button onClick={()=>setAba('ASSINA')} style={aba==='ASSINA'?s.btnA:s.btn}><PenTool/> ASSINATURA</button>
        </nav>

        <div style={s.histBox}>
          <div style={s.histHead}>EVIDÊNCIAS CLOUD ({arquivos.length})</div>
          <div style={s.histList}>
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
          <div style={s.search}><Search size={20}/><input placeholder="Pesquisar lei ou código..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={()=>window.print()} style={s.btnLux}><Printer size={18}/> GERAR PDF</button>
             <label style={s.btnUp}>
                {uploading ? <RefreshCw className="animate-spin"/> : <FilePlus/>} ENVIAR FOTO
                <input type="file" multiple hidden onChange={handleUploadCloud}/>
             </label>
          </div>
        </header>

        <div style={s.content} id="print-area">
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <div style={s.sumarioHead}>
                 <div style={{flex:1}}>
                    <h2 style={{margin:0, color:'#0f0'}}>RELATÓRIO DE AUDITORIA AMBIENTAL</h2>
                    <p style={{fontSize:14, color:'#666'}}>Unidade: {projeto} | Local: {geo.lat}, {geo.lng}</p>
                 </div>
                 <div style={{textAlign:'right'}}>
                    <QrCode size={60} color="#0f0"/>
                    <div style={s.tagRisco}>AUTENTICADO</div>
                 </div>
              </div>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>DESCRIÇÃO DA CONDICIONANTE</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        {isValido(it.codigo) ? <CheckCircle color="#0f0" size={32}/> : <Camera color="#111" size={32}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'DASHBOARD' && (
            <div style={s.pad}>
               <h1 style={{color:'#0f0'}}>Mapa de Risco & Calor (Pará)</h1>
               <div style={s.mapBox}>
                  <div style={{...s.heatPoint, top:'40%', left:'60%', width: (arquivos.length*10)+'px', height:(arquivos.length*10)+'px'}}/>
                  <div style={s.infoMap}>
                     <b>{projeto}</b><br/>
                     GPS: {geo.lat} | {geo.lng}<br/>
                     Status: {arquivos.length > 5 ? 'RISCO BAIXO' : 'ALTO RISCO'}
                  </div>
               </div>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                 <h1>Configuração da Unidade</h1>
                 <button onClick={capturarPosicao} style={s.btnGPS}><MapPin/> ATUALIZAR GPS</button>
              </div>
              <div style={s.grid}>
                <div style={s.field}><label>CNPJ</label><input value={cadastro.cnpj} style={s.in} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})}/></div>
                <div style={s.field}><label>E-MAIL GESTOR</label><input value={cadastro.email} style={s.in} onChange={e=>setCadastro({...cadastro, email:e.target.value})}/></div>
                <div style={s.field}><label>AUDITOR</label><input value={cadastro.responsavel} style={s.in} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})}/></div>
                <div style={s.field}><label>LATITUDE (GPS)</label><input value={geo.lat} style={s.in} readOnly/></div>
                <div style={s.field}><label>LONGITUDE (GPS)</label><input value={geo.lng} style={s.in} readOnly/></div>
              </div>
              <button onClick={async()=> {
                await supabase.from('unidades_maximus').upsert({id:projeto, ...cadastro, latitude:geo.lat, longitude:geo.lng});
                alert("DADOS SINCRONIZADOS COM A NUVEM!");
              }} style={s.btnSave}><Save/> SALVAR NA NUVEM</button>
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
  side: { width: '350px', background: '#080808', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 22, fontWeight: 900, marginBottom: 30, display:'flex', gap:10, alignItems:'center' },
  labelNav: { fontSize:10, color:'#444', marginBottom:5, fontWeight:900 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 12, marginBottom: 20 },
  menu: { display:'flex', flexDirection:'column', gap:8 },
  btn: { display:'flex', alignItems:'center', gap:12, padding:16, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold', borderRadius:12 },
  btnA: { display:'flex', alignItems:'center', gap:12, padding:16, background:'#0a0a0a', border:'1px solid #0f0', color:'#0f0', borderRadius:12, fontWeight:'bold' },
  histBox: { flex: 1, marginTop: 20, background: '#020202', borderRadius: 15, border: '1px solid #111', overflow: 'hidden', display:'flex', flexDirection:'column' },
  histHead: { padding: '10px', fontSize: 9, background: '#0a0a0a', color: '#333', textAlign:'center' },
  histList: { padding: 12, overflowY: 'auto', flex: 1, fontSize: 10 },
  histItem: { marginBottom: 5, color: '#0f0', textDecoration:'none', display:'flex', alignItems:'center', gap:5, opacity:0.6 },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', overflow:'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  search: { flex: 1, background: '#080808', borderRadius: 15, display: 'flex', alignItems: 'center', padding: '0 20px', border:'1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 20px', borderRadius: 12, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center' },
  btnLux: { background: '#fff', color: '#000', padding: '12px 20px', borderRadius: 12, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center' },
  content: { background: '#030303', borderRadius: 35, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  sumarioHead: { background:'#080808', padding:40, borderBottom:'1px solid #111', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tagRisco: { fontSize:10, fontWeight:900, color:'#0f0', marginTop:5 },
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
  btnGPS: { background:'#111', color:'#0f0', border:'1px solid #0f0', padding:'10px 20px', borderRadius:10, cursor:'pointer', display:'flex', gap:10, alignItems:'center' },
  mapBox: { width:'100%', height:400, background:'#050505', borderRadius:20, position:'relative', border:'1px solid #111', overflow:'hidden' },
  heatPoint: { position:'absolute', background:'radial-gradient(circle, #0f0 0%, transparent 70%)', borderRadius:'50%', opacity:0.5 },
  infoMap: { position:'absolute', bottom:20, left:20, background:'#000', padding:15, borderRadius:10, border:'1px solid #222', fontSize:12 }
};
