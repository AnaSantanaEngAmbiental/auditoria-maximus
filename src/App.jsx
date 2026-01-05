import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Building, 
  RefreshCw, Printer, UploadCloud, FileText, Lightbulb, Info
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV81() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [auditData, setAuditData] = useState({});
  const [conhecimento, setConhecimento] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'SELECIONE');
  const [aba, setAba] = useState('AUDITORIA');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    if(projeto !== 'SELECIONE') carregarDadosPhd();
  }, [projeto]);

  const carregarDadosPhd = async () => {
    setLoading(true);
    const { data: leis } = await supabase.from('base_condicionantes').select('*').order('codigo');
    const { data: files } = await supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto);
    const { data: extras } = await supabase.from('auditoria_itens').select('*').eq('projeto_id', projeto);
    const { data: phd } = await supabase.from('base_conhecimento_phd').select('*');
    
    setItems(leis || []);
    setArquivos(files || []);
    setConhecimento(phd || []);
    const mapped = {};
    extras?.forEach(ex => { mapped[ex.codigo_item] = ex; });
    setAuditData(mapped);
    setLoading(false);
  };

  const buscarSugestao = (item) => {
    setItemSelecionado(item);
    // Lógica PhD: Busca na base de conhecimento por código ou palavra-chave
    const sugestao = conhecimento.find(c => 
      c.referencia_legal === item.codigo || 
      item.descricao_de_condicionante.includes(c.palavras_chave)
    );
    return sugestao;
  };

  const handleDrop = async (files) => {
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
        await supabase.from('auditoria_itens').upsert({ projeto_id: projeto, codigo_item: cod, conformidade: true });
      }
    }
    carregarDadosPhd();
    setUploading(false);
  };

  if (loading && projeto !== 'SELECIONE') return <div style={s.load}><RefreshCw className="animate-spin"/> EQUIPE PHD PROCESSANDO...</div>;

  return (
    <div style={s.container} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); handleDrop(Array.from(e.dataTransfer.files))}}>
      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0"/> MAXIMUS PhD</div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="SELECIONE">-- Selecione a Unidade --</option>
          <option value="POSTO_PA">⛽ Posto de Combustível (PA)</option>
          <option value="OFICINA_PA">⚙️ Oficina Mecânica (PA)</option>
          <option value="TRANSPORTE_ANTT">🚚 Transporte ANTT/MOPP</option>
        </select>
        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> AUDITORIA</button>
          <button onClick={()=>setAba('PHD')} style={aba==='PHD'?s.btnA:s.btn}><Lightbulb size={18}/> BASE CONHECIMENTO</button>
        </nav>
      </aside>

      <main style={s.main}>
        <div style={s.grid}>
          {/* COLUNA DA ESQUERDA: LISTA DE AUDITORIA */}
          <div style={s.leftCol}>
            <div style={s.content}>
              <div style={s.scroll}>
                <table style={s.table}>
                  <thead><tr style={s.th}><th>ITEM</th><th>DESCRIÇÃO</th><th>STATUS</th></tr></thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{...s.tr, background: itemSelecionado?.codigo === it.codigo ? '#0f01' : 'transparent'}} onClick={() => setItemSelecionado(it)}>
                        <td style={s.tdCod}>{it.codigo}</td>
                        <td style={s.tdDesc}>{it.descricao_de_condicionante.substring(0, 80)}...</td>
                        <td>{arquivos.some(a=>String(a.codigo_condicionante)===String(it.codigo).toUpperCase()) ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUNA DA DIREITA: PAINEL DE INTELIGÊNCIA */}
          <div style={s.rightCol}>
            {itemSelecionado ? (
              <div style={s.phdPanel}>
                <div style={s.phdHeader}><Info size={20}/> CONSULTORIA TÉCNICA PHD</div>
                <h3 style={{color:'#0f0'}}>Item {itemSelecionado.codigo}</h3>
                <p style={{fontSize:13, color:'#888'}}>{itemSelecionado.descricao_de_condicionante}</p>
                <hr style={s.hr}/>
                
                <h4>💡 Resposta Técnica Sugerida:</h4>
                <div style={s.sugestaoBox}>
                  {conhecimento.find(c => c.referencia_legal === String(itemSelecionado.codigo))?.resposta_tecnica || "Inicie o upload para que eu possa analisar este item conforme as normas da SEMAS."}
                </div>

                <div style={s.uploadArea}>
                   <UploadCloud size={40} color="#333"/>
                   <p>Arraste a foto/documento aqui para vincular ao item {itemSelecionado.codigo}</p>
                </div>
              </div>
            ) : (
              <div style={s.phdEmpty}>Selecione um item da lista para ver a análise técnica sugerida.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  side: { width: '280px', background: '#080808', padding: '25px', borderRight: '1px solid #111' },
  brand: { fontSize: 22, fontWeight: 900, color: '#0f0', marginBottom: 40, display:'flex', gap:10 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: 10, width:'100%', marginBottom: 30 },
  menu: { display:'flex', flexDirection:'column', gap:10 },
  btn: { display:'flex', gap:10, padding:15, background:'none', border:'none', color:'#444', fontWeight:'bold', cursor:'pointer', textAlign:'left' },
  btnA: { display:'flex', gap:10, padding:15, background:'#111', border:'1px solid #0f0', color:'#0f0', borderRadius:12, fontWeight:'bold' },
  main: { flex: 1, padding: '20px', overflow: 'hidden' },
  grid: { display: 'flex', gap: '20px', height: '100%' },
  leftCol: { flex: 1, background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden' },
  rightCol: { width: '400px', background: '#080808', borderRadius: 20, border: '1px solid #111', padding: '25px' },
  content: { height: '100%' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#333', fontSize: 10, position: 'sticky', top: 0, background: '#080808' },
  tr: { borderBottom: '1px solid #0a0a0a', cursor: 'pointer' },
  tdCod: { padding: '15px', color: '#0f0', fontWeight: 'bold' },
  tdDesc: { padding: '15px', color: '#888', fontSize: 12 },
  phdPanel: { display: 'flex', flexDirection: 'column', gap: 15 },
  phdHeader: { fontSize: 12, fontWeight: 'bold', color: '#333', display: 'flex', gap: 10, borderBottom: '1px solid #111', paddingBottom: 10 },
  hr: { border: '0', borderTop: '1px solid #111' },
  sugestaoBox: { background: '#0f01', border: '1px solid #0f02', padding: 20, borderRadius: 12, color: '#ccc', fontSize: 14, lineHeight: 1.5 },
  uploadArea: { border: '2px dashed #111', borderRadius: 15, padding: 30, textAlign: 'center', marginTop: 20, color: '#333' },
  phdEmpty: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#222', textAlign:'center' },
  load: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0' }
};
