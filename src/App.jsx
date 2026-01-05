import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Shield, CheckCircle, Search, FilePlus, Download, 
  Truck, RefreshCw, UploadCloud, Lightbulb, AlertTriangle, 
  FileText, Calendar, HardDrive, Eye
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV87() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [auditData, setAuditData] = useState({});
  const [conhecimento, setConhecimento] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'SELECIONE');
  const [itemAtivo, setItemAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    if(projeto !== 'SELECIONE') carregarEngenharia();
  }, [projeto]);

  const carregarEngenharia = async () => {
    setLoading(true);
    try {
      const [resLeis, resFiles, resExtras, resPhd] = await Promise.all([
        supabase.from('base_condicionantes').select('*').order('codigo'),
        supabase.from('auditoria_arquivos').select('*').eq('projeto_id', projeto),
        supabase.from('auditoria_itens').select('*').eq('projeto_id', projeto),
        supabase.from('base_conhecimento_phd').select('*')
      ]);

      setItems(resLeis.data || []);
      setArquivos(resFiles.data || []);
      setConhecimento(resPhd.data || []);
      
      const mapped = {};
      resExtras.data?.forEach(ex => { mapped[ex.codigo_item] = ex; });
      setAuditData(mapped);
    } catch (e) {
      console.error("Erro Crítico:", e);
    }
    setLoading(false);
  };

  // Lógica PhD: Verifica vencimento e retorna cor de alerta
  const getStatusCor = (data) => {
    if (!data) return '#111';
    const hoje = new Date();
    const venc = new Date(data);
    const dias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    if (dias < 0) return '#400'; // Vencido (Vermelho escuro)
    if (dias <= 30) return '#440'; // Alerta (Amarelo escuro)
    return '#020'; // OK (Verde escuro)
  };

  const handleUpload = async (files) => {
    setUploading(true);
    for (const file of files) {
      const cod = file.name.split('.')[0].toUpperCase();
      const path = `${projeto}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('maximus_evidencias').upload(path, file);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('maximus_evidencias').getPublicUrl(path);
        await supabase.from('auditoria_arquivos').insert({
          projeto_id: projeto, codigo_condicionante: cod, nome_arquivo: file.name, url_storage: publicUrl
        });
        await supabase.from('auditoria_itens').upsert({ 
          projeto_id: projeto, codigo_item: cod, conformidade: true 
        });
      }
    }
    carregarEngenharia();
    setUploading(false);
  };

  if (loading && projeto !== 'SELECIONE') return <div style={s.load}><RefreshCw className="animate-spin" size={60}/> VARREDURA TÉCNICA EM CURSO...</div>;

  return (
    <div style={s.container} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files))}}>
      {/* SIDEBAR PhD */}
      <aside style={s.side}>
        <div style={s.brand}><Shield color="#0f0" size={35}/> MAXIMUS <span style={{color:'#fff'}}>PhD</span></div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="SELECIONE">-- SELECIONE ATIVIDADE --</option>
          <option value="POSTO_CANAA">⛽ POSTO CANAÃ (PA)</option>
          <option value="TRANSP_ANTT">🚚 TRANSPORTE ANTT/MOPP</option>
          <option value="INDUSTRIA_PHD">🏭 INDÚSTRIA ALIMENTÍCIA</option>
        </select>

        <nav style={s.menu}>
          <button style={s.btnA}><Scale size={24}/> AUDITORIA</button>
          <button style={s.btn}><Truck size={24}/> EXTRATO ANTT</button>
          <button style={s.btn}><FileText size={24}/> GERAR OFÍCIOS</button>
        </nav>

        <div style={s.infoBox}>
           <HardDrive size={20} color="#0f0"/> <b>Status Supabase:</b> 
           <div style={{color:'#0f0', fontSize:'14px'}}>Sincronizado com Sucesso</div>
        </div>
      </aside>

      {/* PAINEL CENTRAL */}
      <main style={s.main}>
        <div style={s.grid}>
          {/* LISTAGEM DE REQUISITOS (FONTE 20) */}
          <div style={s.panelLeft}>
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓDIGO</th><th>REQUISITO AMBIENTAL</th><th>VIGÊNCIA</th></tr></thead>
                <tbody>
                  {items.map((it, idx) => {
                    const status = auditData[it.codigo];
                    return (
                      <tr key={idx} style={{...s.tr, background: itemAtivo?.id === it.id ? '#0f01' : 'transparent'}} onClick={() => setItemAtivo(it)}>
                        <td style={s.tdCod}>{it.codigo}</td>
                        <td style={s.tdDesc}>{it.descricao_de_condicionante || "Sem descrição"}</td>
                        <td style={{...s.tdVenc, background: getStatusCor(status?.validade_civ)}}>
                          {status?.validade_civ ? new Date(status.validade_civ).toLocaleDateString() : '---'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAINEL DE INTELIGÊNCIA */}
          <div style={s.panelRight}>
            {itemAtivo ? (
              <div style={s.phdBox}>
                <h1 style={{fontSize: 45, color: '#0f0', margin:0}}>ITEM {itemAtivo.codigo}</h1>
                
                <div style={s.cardPhd}>
                  <label style={s.label}>RESPOSTA TÉCNICA SUGERIDA (BASE PhD):</label>
                  <div style={s.sugestao}>
                    {conhecimento.find(c => String(c.referencia_legal) === String(itemAtivo.codigo))?.resposta_tecnica || "Inicie o preenchimento para obter sugestão do doutor."}
                  </div>
                </div>

                <div style={s.cardPhd}>
                  <label style={s.label}>PLACA E DOCUMENTAÇÃO TÉCNICA:</label>
                  <input 
                    style={s.inputGrande} 
                    placeholder="PLACA / CIV / CIPP" 
                    value={auditData[itemAtivo.codigo]?.placa_veiculo || ''}
                    onChange={async (e) => {
                        const val = e.target.value.toUpperCase();
                        setAuditData(p => ({...p, [itemAtivo.codigo]: {...p[itemAtivo.codigo], placa_veiculo: val}}));
                        await supabase.from('auditoria_itens').upsert({projeto_id: projeto, codigo_item: itemAtivo.codigo, placa_veiculo: val});
                    }}
                  />
                  <div style={{display:'flex', gap:10, marginTop:15}}>
                     <input type="date" style={s.inputPequeno} title="Validade CIV" />
                     <input type="date" style={s.inputPequeno} title="Validade CIPP" />
                  </div>
                </div>

                <div style={s.dropArea}>
                   <UploadCloud size={60} color="#111"/>
                   <p style={{fontSize: 22, fontWeight: 'bold', color: '#222'}}>SOLTE A FOTO OU PDF AQUI</p>
                </div>
              </div>
            ) : (
              <div style={s.emptyPhd}><Lightbulb size={120} color="#050505"/><h2>Selecione uma condicionante para suporte técnico.</h2></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontSize: '20px', fontFamily: 'Inter, sans-serif' },
  load: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0f0', fontWeight: 'bold' },
  side: { width: '400px', background: '#080808', padding: '40px', borderRight: '1px solid #111' },
  brand: { fontSize: '32px', fontWeight: 900, color: '#0f0', marginBottom: 60, display: 'flex', gap: 15 },
  select: { background: '#111', color: '#fff', border: '2px solid #222', padding: '20px', borderRadius: 15, width: '100%', fontSize: '20px', marginBottom: 40 },
  menu: { display: 'flex', flexDirection: 'column', gap: 15, flex: 1 },
  btn: { display: 'flex', gap: 15, padding: 25, background: 'none', border: 'none', color: '#444', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' },
  btnA: { display: 'flex', gap: 15, padding: 25, background: '#111', border: '2px solid #0f0', color: '#0f0', fontSize: '22px', fontWeight: 'bold', borderRadius: 15, textAlign: 'left' },
  infoBox: { background: '#020202', padding: '25px', borderRadius: 20, border: '1px solid #111' },
  main: { flex: 1, padding: '40px', overflow: 'hidden' },
  grid: { display: 'flex', gap: '40px', height: '100%' },
  panelLeft: { flex: 1.5, background: '#020202', borderRadius: 30, border: '1px solid #111', overflow: 'hidden' },
  panelRight: { flex: 1, background: '#080808', borderRadius: 30, border: '1px solid #111', padding: '40px', overflowY: 'auto' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px 30px', color: '#222', background: '#080808', fontSize: '14px' },
  tr: { borderBottom: '1px solid #0a0a0a', cursor: 'pointer' },
  tdCod: { padding: '35px', color: '#0f0', fontSize: '38px', fontWeight: '900' },
  tdDesc: { padding: '35px', color: '#ccc', fontSize: '22px', lineHeight: '1.5' },
  tdVenc: { padding: '15px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px' },
  phdBox: { display: 'flex', flexDirection: 'column', gap: 30 },
  cardPhd: { background: '#000', padding: '30px', borderRadius: '25px', border: '1px solid #151515' },
  label: { fontSize: '14px', color: '#444', marginBottom: 15, display: 'block' },
  sugestao: { color: '#0f0', fontSize: '24px', lineHeight: '1.6' },
  inputGrande: { background: '#0a0a0a', border: '2px solid #222', color: '#fff', padding: '25px', borderRadius: '15px', fontSize: '28px', width: '90%' },
  inputPequeno: { background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '16px', flex: 1 },
  dropArea: { border: '5px dashed #111', borderRadius: '30px', padding: '60px', textAlign: 'center' },
  emptyPhd: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }
};
