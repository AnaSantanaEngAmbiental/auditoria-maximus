import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, MapPin, Building, 
  Save, RefreshCw, Printer, QrCode, UploadCloud, FileSpreadsheet, AlertCircle, Calendar
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV76() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [auditData, setAuditData] = useState({}); // Para Placas e Vencimentos
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao_PA');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    carregarDados();
  }, [projeto]);

  const carregarDados = async () => {
    setLoading(true);
    // Busca Condicionantes
    const { data: leis } = await supabase.from('base_condicionantes').select('*').order('codigo');
    setItems(leis || []);
    
    // Busca Fotos/Arquivos
    const { data: files } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
    setArquivos(files || []);

    // Busca Dados Extras (Placas e Vencimentos)
    const { data: extras } = await supabase.from('auditoria_itens').select('*').eq('projeto_id', projeto);
    const mappedExtras = {};
    extras?.forEach(ex => { mappedExtras[ex.codigo_item] = ex; });
    setAuditData(mappedExtras);
    
    setLoading(false);
  };

  const handleUpload = async (files) => {
    setUploading(true);
    for (const file of files) {
      const cod = file.name.split('.')[0].toUpperCase();
      const path = `${projeto}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('maximus_evidencias').upload(path, file);
      
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('maximus_evidencias').getPublicUrl(path);
        await supabase.from('auditoria_arquivos').insert({
          projeto_id: projeto, codigo_condicionante: cod, nome_arquivo: file.name.toUpperCase(), url_storage: publicUrl
        });
        await supabase.from('auditoria_itens').upsert({
          projeto_id: projeto, codigo_item: cod, conformidade: true
        });
      }
    }
    carregarDados();
    setUploading(false);
  };

  const salvarExtra = async (cod, campo, valor) => {
    await supabase.from('auditoria_itens').upsert({
      projeto_id: projeto,
      codigo_item: cod,
      [campo]: valor
    });
    setAuditData(prev => ({ ...prev, [cod]: { ...prev[cod], [campo]: valor } }));
  };

  const exportarExcel = () => {
    let csv = "\ufeffCÓDIGO;DESCRIÇÃO;CATEGORIA;STATUS;PLACA;VENCIMENTO;EVIDÊNCIA\n";
    items.forEach(it => {
      const arq = arquivos.find(a => String(a.codigo_condicionante) === String(it.codigo).toUpperCase());
      const extra = auditData[it.codigo] || {};
      csv += `${it.codigo};"${it.descricao_de_condicionante}";"${it.categoria}";${arq ? 'OK' : 'PENDENTE'};${extra.placa_veiculo || ''};${extra.vencimento_documento || ''};${arq ? arq.url_storage : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Audit_Maximus_${projeto}.csv`;
    link.click();
  };

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin"/> SINCRONIZANDO COM O SUPABASE...</div>;

  return (
    <div 
      style={s.container}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(Array.from(e.dataTransfer.files)); }}
    >
      {isDragging && <div style={s.dragOverlay}><UploadCloud size={80} color="#0f0"/><h1>SOLTE PARA ARQUIVAR</h1></div>}

      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0"/> MAXIMUS PhD</div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao_PA">⛏️ MINERAÇÃO PARÁ</option>
          <option value="Logistica_Canaa">🚚 LOGÍSTICA CANAÃ</option>
        </select>
        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> AUDITORIA</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.btnA:s.btn}><Building/> UNIDADES</button>
          <button onClick={()=>setAba('ASSINA')} style={aba==='ASSINA'?s.btnA:s.btn}><PenTool/> ASSINATURA</button>
        </nav>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.search}><Search size={20}/><input placeholder="Filtrar por requisito..." style={s.inBusca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={exportarExcel} style={s.btnExcel}><FileSpreadsheet size={18}/> EXPORTAR EXCEL</button>
             <label style={s.btnUp}>{uploading ? <RefreshCw className="spin"/> : <FilePlus/>} FOTO <input type="file" multiple hidden onChange={e=>handleUpload(Array.from(e.target.files))}/></label>
          </div>
        </header>

        <div style={s.content}>
          <div style={s.scroll}>
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th>PLACA</th><th>VENCIMENTO</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {items.filter(i=>i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                  <tr key={idx} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>
                      {it.descricao_de_condicionante}
                      <div style={s.cat}>{it.categoria}</div>
                    </td>
                    <td>
                      <input 
                        style={s.miniIn} 
                        placeholder="Placa..." 
                        value={auditData[it.codigo]?.placa_veiculo || ''} 
                        onChange={(e)=>salvarExtra(it.codigo, 'placa_veiculo', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <input 
                        type="date" 
                        style={s.miniIn} 
                        value={auditData[it.codigo]?.vencimento_documento || ''} 
                        onChange={(e)=>salvarExtra(it.codigo, 'vencimento_documento', e.target.value)}
                      />
                    </td>
                    <td style={{textAlign:'center'}}>
                      {arquivos.some(a=>String(a.codigo_condicionante) === String(it.codigo).toUpperCase()) 
                        ? <CheckCircle color="#0f0" size={28}/> 
                        : <AlertCircle color="#111" size={28}/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif', position: 'relative' },
  load: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0', gap:10 },
  dragOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,255,0,0.1)', zIndex:1000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)', border:'4px dashed #0f0' },
  side: { width: '280px', background: '#080808', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #111' },
  brand: { fontSize: 20, fontWeight: 900, marginBottom: 30, color: '#0f0', display: 'flex', gap: 10 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: 8, marginBottom: 20 },
  menu: { display:'flex', flexDirection:'column', gap:8, flex: 1 },
  btn: { display:'flex', alignItems:'center', gap:12, padding:14, background:'none', border:'none', color:'#444', cursor:'pointer', textAlign:'left', fontWeight:'bold' },
  btnA: { display:'flex', alignItems:'center', gap:12, padding:14, background:'#111', border:'1px solid #0f0', color:'#0f0', borderRadius:10, fontWeight:'bold' },
  main: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow:'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  search: { flex: 1, background: '#080808', borderRadius: 12, display: 'flex', alignItems: 'center', padding: '0 15px', border: '1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '10px 18px', borderRadius: 8, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8 },
  btnExcel: { background: '#107c41', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: '900', cursor: 'pointer', border: 'none', display:'flex', gap:8 },
  content: { background: '#030303', borderRadius: 20, border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#333', fontSize: 10, background: '#080808' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdDesc: { padding: '20px', color: '#ccc', fontSize: 14, width: '40%' },
  cat: { fontSize: 9, color: '#050', marginTop: 4, fontWeight: 'bold' },
  miniIn: { background: '#111', border: '1px solid #222', color: '#fff', padding: '8px', borderRadius: 6, fontSize: 11, width: '90%' }
};
