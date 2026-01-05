import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Building, 
  RefreshCw, Printer, UploadCloud, FileText, Lightbulb, Info, AlertTriangle
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV82() {
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
    if(projeto !== 'SELECIONE') carregarEngenhariaAmbiental();
  }, [projeto]);

  const carregarEngenhariaAmbiental = async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("Erro na carga PhD:", err);
    }
    setLoading(false);
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
        await supabase.from('auditoria_itens').upsert({ 
          projeto_id: projeto, codigo_item: cod, conformidade: true, updated_at: new Date() 
        });
      }
    }
    carregarEngenhariaAmbiental();
    setUploading(false);
  };

  // Lógica de Documentação ANTT/MOPP
  const salvarDadoTecnico = async (cod, campo, valor) => {
    const novoValor = valor.toUpperCase();
    setAuditData(p => ({...p, [cod]: {...p[cod], [campo]: novoValor}}));
    await supabase.from('auditoria_itens').upsert({
      projeto_id: projeto,
      codigo_item: cod,
      [campo]: novoValor
    });
  };

  if (loading && projeto !== 'SELECIONE') return <div style={s.load}><RefreshCw className="animate-spin" size={40}/> SINCRONIZANDO INTELIGÊNCIA AMBIENTAL...</div>;

  return (
    <div style={s.container} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); handleDrop(Array.from(e.dataTransfer.files))}}>
      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0" size={32}/> MAXIMUS PhD</div>
        
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="SELECIONE">-- SELECIONE A UNIDADE --</option>
          <option value="POSTO_BELEM">⛽ Posto de Combustível</option>
          <option value="TRANSP_ANTT">🚚 Transporte (ANTT/MOPP)</option>
          <option value="INDUSTRIA_PA">🏭 Indústria/Fábrica</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={24}/> AUDITORIA</button>
          <button onClick={()=>setAba('DOCUMENTOS')} style={aba==='DOCUMENTOS'?s.btnA:s.btn}><FileText size={24}/> DOCUMENTOS / ANTT</button>
        </nav>
      </aside>

      <main style={s.main}>
        <div style={s.grid}>
          {/* PAINEL DE LEIS E REQUISITOS */}
          <div style={s.leftCol}>
            <div style={s.scroll}>
              <table style={s.table}>
                <thead>
                  <tr style={s.th}>
                    <th style={{width: 100}}>ITEM</th>
                    <th>DESCRIÇÃO TÉCNICA E REQUISITOS SEMAS/PA</th>
                    <th style={{width: 150}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const temEvidencia = arquivos.some(a=>String(a.codigo_condicionante)===String(it.codigo).toUpperCase());
                    return (
                      <tr key={idx} style={{...s.tr, background: itemSelecionado?.codigo === it.codigo ? '#0f01' : 'transparent'}} onClick={() => setItemSelecionado(it)}>
                        <td style={s.tdCod}>{it.codigo}</td>
                        <td style={s.tdDesc}>
                          {it.descricao_de_condicionante || "Descrição não cadastrada"}
                          <div style={s.tag}>{it.categoria}</div>
                        </td>
                        <td style={{textAlign:'center'}}>
                          {temEvidencia ? <CheckCircle color="#0f0" size={30}/> : <AlertTriangle color="#333" size={30}/>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAINEL PHD DE CONSULTORIA E DADOS TÉCNICOS */}
          <div style={s.rightCol}>
            {itemSelecionado ? (
              <div style={s.phdPanel}>
                <h2 style={s.phdTitle}>ANÁLISE PHD: ITEM {itemSelecionado.codigo}</h2>
                
                <div style={s.cardInfo}>
                  <label style={s.label}>RESPOSTA TÉCNICA SUGERIDA (BASE DE CONHECIMENTO):</label>
                  <div style={s.sugestao}>
                    {conhecimento.find(c => String(c.referencia_legal) === String(itemSelecionado.codigo))?.resposta_tecnica 
                      || "⚠️ Nenhuma resposta técnica padrão para este item. Sugerimos anexar evidência fotográfica da conformidade."}
                  </div>
                </div>

                <div style={s.cardData}>
                   <label style={s.label}>DADOS DE FROTA / DOCUMENTAÇÃO (CIV, CIPP, MOPP):</label>
                   <input 
                     style={s.inputGrande} 
                     placeholder="Digite a Placa ou Nº Documento..." 
                     value={auditData[itemSelecionado.codigo]?.placa_veiculo || ''}
                     onChange={(e) => salvarDadoTecnico(itemSelecionado.codigo, 'placa_veiculo', e.target.value)}
                   />
                </div>

                <div style={s.dropZone}>
                   <UploadCloud size={50} color="#0f0"/>
                   <p style={{fontSize: 18}}>ARRASTE EVIDÊNCIA PARA ESTE ITEM</p>
                </div>
                
                {arquivos.filter(a => String(a.codigo_condicionante) === String(itemSelecionado.codigo).toUpperCase()).map(arq => (
                  <img src={arq.url_storage} style={s.preview} key={arq.id} />
                ))}
              </div>
            ) : (
              <div style={s.emptyPhd}>
                <Lightbulb size={60} color="#111"/>
                <h2>Selecione um item para análise técnica de engenharia</h2>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontSize: '20px' },
  load: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0', fontWeight:'bold', gap:15 },
  side: { width: '350px', background: '#080808', padding: '30px', borderRight: '1px solid #151515' },
  brand: { fontSize: '28px', fontWeight: 900, color: '#0f0', marginBottom: 50, display: 'flex', gap: 10 },
  select: { background: '#111', color: '#fff', border: '2px solid #222', padding: '15px', borderRadius: 12, width:'100%', marginBottom: 40, fontSize: '18px' },
  menu: { display: 'flex', flexDirection: 'column', gap: 20 },
  btn: { display: 'flex', gap: 15, padding: 20, background: 'none', border: 'none', color: '#444', fontWeight: 'bold', cursor: 'pointer', fontSize: '20px', textAlign:'left' },
  btnA: { display: 'flex', gap: 15, padding: 20, background: '#111', border: '2px solid #0f0', color: '#0f0', borderRadius: 15, fontWeight: 'bold', fontSize: '20px' },
  main: { flex: 1, padding: '30px', overflow: 'hidden' },
  grid: { display: 'flex', gap: '30px', height: '100%' },
  leftCol: { flex: 1.5, background: '#020202', borderRadius: 25, border: '1px solid #111', overflow: 'hidden' },
  rightCol: { flex: 1, background: '#080808', borderRadius: 25, border: '1px solid #111', padding: '30px', overflowY: 'auto' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', color: '#333', fontSize: '14px', background: '#080808', position:'sticky', top:0 },
  tr: { borderBottom: '1px solid #0a0a0a', cursor: 'pointer' },
  tdCod: { padding: '30px', color: '#0f0', fontWeight: '900', fontSize: '32px' },
  tdDesc: { padding: '30px', color: '#ccc', fontSize: '20px', lineHeight: '1.4' },
  tag: { fontSize: '12px', color: '#050', fontWeight: 'bold', marginTop: 10, textTransform: 'uppercase' },
  phdPanel: { display: 'flex', flexDirection: 'column', gap: 25 },
  phdTitle: { fontSize: '24px', color: '#0f0', fontWeight: '900' },
  label: { fontSize: '14px', color: '#444', fontWeight: 'bold', marginBottom: 10, display:'block' },
  sugestao: { background: '#0f01', border: '1px solid #0f03', padding: '20px', borderRadius: '15px', color: '#0f0', fontSize: '18px', lineHeight: '1.6' },
  inputGrande: { background: '#000', border: '2px solid #222', color: '#fff', padding: '20px', borderRadius: '12px', fontSize: '22px', width: '100%', outline: 'none' },
  dropZone: { border: '3px dashed #1a1a1a', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#222' },
  preview: { width: '100%', borderRadius: '15px', marginTop: 15, border: '1px solid #222' },
  emptyPhd: { height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity: 0.2, textAlign:'center' }
};
