import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Building, 
  Save, RefreshCw, Printer, UploadCloud, FileSpreadsheet, FileText, Map
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV80() {
  // --- ESTADOS DE LOGICA ---
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [auditData, setAuditData] = useState({});
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'SELECIONE');
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- BUSCA DE HISTÓRICO E SINCRONIA ---
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    if(projeto !== 'SELECIONE') carregarSistemaCompleto();
  }, [projeto]);

  const carregarSistemaCompleto = async () => {
    setLoading(true);
    // 1. Carrega o Roteiro de Leis (DNA Ambiental)
    const { data: leis } = await supabase.from('base_condicionantes').select('*').order('codigo');
    // 2. Carrega as Evidências (Arquivos e Fotos)
    const { data: files } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
    // 3. Carrega os Dados Técnicos (Placas, CIV, CIPP, MOPP)
    const { data: extras } = await supabase.from('auditoria_itens').select('*').eq('projeto_id', projeto);
    
    setItems(leis || []);
    setArquivos(files || []);
    const mapped = {};
    extras?.forEach(ex => { mapped[ex.codigo_item] = ex; });
    setAuditData(mapped);
    setLoading(false);
  };

  // --- LÓGICA DE ARRASTE E COLE (DRAG & DROP) ---
  const processarArquivos = async (files) => {
    setUploading(true);
    for (const file of files) {
      // Lógica recuperada: Identifica item pelo nome (ex: "1.1.pdf")
      const cod = file.name.split('.')[0].toUpperCase();
      const path = `${projeto}/${Date.now()}_${file.name}`;
      
      const { error: upErr } = await supabase.storage.from('maximus_evidencias').upload(path, file);
      
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('maximus_evidencias').getPublicUrl(path);
        // Vincula no banco de dados
        await supabase.from('auditoria_arquivos').insert({
          projeto_id: projeto, codigo_condicionante: cod, nome_arquivo: file.name.toUpperCase(), url_storage: publicUrl
        });
        // Marca conformidade automática
        await supabase.from('auditoria_itens').upsert({ projeto_id: projeto, codigo_item: cod, conformidade: true });
      }
    }
    carregarSistemaCompleto();
    setUploading(false);
  };

  // --- LÓGICA DE GERAÇÃO DE OFÍCIO (REQUERIMENTO PADRÃO) ---
  const gerarOficio = () => {
    const doc = `
      OFÍCIO DE REQUERIMENTO PADRÃO - SEMAS/PA
      À Secretaria de Meio Ambiente.
      
      A empresa referente ao projeto ${projeto}, vem por meio deste requerer a análise do 
      processo de Licenciamento Ambiental, conforme as condicionantes anexas.
      
      Itens em Conformidade: ${arquivos.length}
      Itens Pendentes: ${items.length - arquivos.length}
      
      Gerado automaticamente pelo Sistema Maximus PhD.
    `;
    const blob = new Blob([doc], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Oficio_${projeto}.txt`;
    link.click();
  };

  if (loading && projeto !== 'SELECIONE') return <div style={s.load}><RefreshCw className="animate-spin"/> RECONSTRUINDO AMBIENTE...</div>;

  return (
    <div 
      style={s.container}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); processarArquivos(Array.from(e.dataTransfer.files)); }}
    >
      {/* PAINEL DE ARRASTE ATIVO */}
      {isDragging && <div style={s.dragBox}><UploadCloud size={80}/><h1>SOLTE PARA PROCESSAR NO PROJETO {projeto}</h1></div>}

      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0"/> MAXIMUS PhD</div>
        
        <label style={s.label}>PROCESSO / UNIDADE:</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="SELECIONE">-- Selecione a Atividade --</option>
          <option value="POSTO_GASOLINA">⛽ Posto de Combustível</option>
          <option value="OFICINA_MECANICA">⚙️ Oficina Mecânica</option>
          <option value="TRANSP_PROD_PERIGOSO">🚚 Transp. Prod. Perigosos</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> AUDITORIA TÉCNICA</button>
          <button onClick={()=>setAba('DOCUMENTOS')} style={aba==='DOCUMENTOS'?s.btnA:s.btn}><FileText size={18}/> GERAR OFÍCIOS</button>
          <button onClick={()=>setAba('ANALYTICS')} style={aba==='ANALYTICS'?s.btnA:s.btn}><BarChart3 size={18}/> DASHBOARD</button>
        </nav>

        <div style={s.statusCard}>
           <div style={{fontSize:12, color:'#888'}}>Conclusão do Processo</div>
           <div style={{fontSize:24, fontWeight:900, color:'#0f0'}}>{Math.round((arquivos.length/(items.length||1))*100)}%</div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
           <div style={s.search}><Search size={18}/><input placeholder="Filtrar por Condicionante ou Requisito..." style={s.inBusca}/></div>
           <button onClick={gerarOficio} style={s.btnOficio}><FileText size={18}/> GERAR REQUERIMENTO</button>
        </header>

        <div style={s.content}>
           {projeto === 'SELECIONE' ? (
             <div style={s.empty}><Map size={100} color="#111"/> <h2>Aguardando seleção de processo individual...</h2></div>
           ) : (
             <div style={s.scroll}>
               <table style={s.table}>
                  <thead>
                    <tr style={s.th}>
                      <th style={{width:80}}>ITEM</th>
                      <th>REQUISITO AMBIENTAL</th>
                      <th>DADOS TÉCNICOS (PLACA/VALIDADE)</th>
                      <th style={{textAlign:'center'}}>EVIDÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const arq = arquivos.find(a => String(a.codigo_condicionante) === String(it.codigo).toUpperCase());
                      return (
                        <tr key={idx} style={s.tr}>
                          <td style={s.tdCod}>{it.codigo}</td>
                          <td style={s.tdDesc}>
                             {it.descricao_de_condicionante}
                             <div style={s.tag}>{it.categoria}</div>
                          </td>
                          <td style={{width: 250}}>
                             <div style={{display:'flex', flexDirection:'column', gap:5}}>
                               <input 
                                 placeholder="Placa / CIV / CIPP" 
                                 style={s.miniIn} 
                                 value={auditData[it.codigo]?.placa_veiculo || ''}
                                 onChange={async (e) => {
                                   const val = e.target.value.toUpperCase();
                                   setAuditData(p => ({...p, [it.codigo]: {...p[it.codigo], placa_veiculo: val}}));
                                   await supabase.from('auditoria_itens').upsert({projeto_id: projeto, codigo_item: it.codigo, placa_veiculo: val});
                                 }}
                               />
                               <input 
                                 type="date" 
                                 style={s.miniIn} 
                                 value={auditData[it.codigo]?.vencimento_documento || ''}
                                 onChange={async (e) => {
                                   const val = e.target.value;
                                   setAuditData(p => ({...p, [it.codigo]: {...p[it.codigo], vencimento_documento: val}}));
                                   await supabase.from('auditoria_itens').upsert({projeto_id: projeto, codigo_item: it.codigo, vencimento_documento: val});
                                 }}
                               />
                             </div>
                          </td>
                          <td style={{textAlign:'center'}}>
                             {arq ? <img src={arq.url_storage} style={s.thumb}/> : <Camera size={30} color="#111"/>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
               </table>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  dragBox: { position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,255,0,0.2)', zIndex:999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)', border:'4px dashed #0f0' },
  side: { width: '320px', background: '#080808', padding: '25px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #111' },
  brand: { fontSize: 24, fontWeight: 900, color: '#0f0', marginBottom: 40, display:'flex', gap:10 },
  label: { fontSize: 10, color: '#444', fontWeight: 'bold', marginBottom: 5 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: 10, marginBottom: 30 },
  menu: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10 },
  btn: { display: 'flex', alignItems: 'center', gap: 12, padding: 15, background: 'none', border: 'none', color: '#444', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' },
  btnA: { display: 'flex', alignItems: 'center', gap: 12, padding: 15, background: '#111', border: '1px solid #0f0', color: '#0f0', borderRadius: 12, fontWeight: 'bold' },
  statusCard: { background: '#050505', padding: 20, borderRadius: 20, border: '1px solid #111' },
  main: { flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, gap: 15 },
  search: { flex: 1, background: '#080808', borderRadius: 15, display: 'flex', alignItems: 'center', padding: '0 20px', border: '1px solid #111' },
  inBusca: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnOficio: { background: '#fff', color: '#000', padding: '12px 25px', borderRadius: 12, fontWeight: '900', border: 'none', display:'flex', gap:8, cursor:'pointer' },
  content: { background: '#020202', borderRadius: 30, flex: 1, overflow: 'hidden', border: '1px solid #0a0a0a' },
  scroll: { overflowY: 'auto', height: '100%' },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', opacity: 0.3 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', color: '#333', fontSize: 10, background: '#080808', position: 'sticky', top: 0 },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: '900', fontSize: 20 },
  tdDesc: { padding: '25px', color: '#ccc', fontSize: 15 },
  tag: { fontSize: 10, color: '#050', fontWeight: 'bold', marginTop: 5 },
  miniIn: { background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: 8, fontSize: 12, width: '100%' },
  thumb: { width: 100, borderRadius: 10, border: '1px solid #222' },
  load: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0', background:'#000', fontWeight:'bold', gap:10 }
};
