import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, FileText, Trash2, CheckCircle } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV28() {
  const [items, setItems] = useState([]);
  const [render, setRender] = useState(0); // Forçador de atualização visual
  const listaDeArquivos = useRef([]); // Caixa forte que não apaga

  useEffect(() => {
    async function carregarBanco() {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
    }
    carregarBanco();
    
    // Recupera do cache do navegador se existir
    const salvos = localStorage.getItem('maximus_cache');
    if (salvos) {
      listaDeArquivos.current = JSON.parse(salvos);
      setRender(r => r + 1);
    }
  }, []);

  const handleFiles = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      hora: new Date().toLocaleTimeString()
    }));

    // Adiciona à caixa forte
    listaDeArquivos.current = [...listaDeArquivos.current, ...novos];
    
    // Salva no cache para não perder ao atualizar
    localStorage.setItem('maximus_cache', JSON.stringify(listaDeArquivos.current));
    
    // Força o React a redesenhar a tela
    setRender(r => r + 1);
    alert(`${novos.length} arquivos inseridos com sucesso!`);
  };

  const limpar = () => {
    listaDeArquivos.current = [];
    localStorage.removeItem('maximus_cache');
    setRender(r => r + 1);
  };

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
      
      {/* BARRA LATERAL */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        
        <div style={s.stats}>
          <div style={s.statItem}>
            <small>CONDICIONANTES</small>
            <strong>{items.length}</strong>
          </div>
          <div style={s.statItem}>
            <small>ARQUIVOS LIDOS</small>
            <strong style={{color:'#00ff00'}}>{listaDeArquivos.current.length}</strong>
          </div>
        </div>

        <div style={s.listaContainer}>
          <div style={s.listaHeader}>
            <span>LISTA DE EVIDÊNCIAS</span>
            <Trash2 size={14} onClick={limpar} style={{cursor:'pointer', color:'#ff4444'}}/>
          </div>
          
          <div style={s.scroll}>
            {listaDeArquivos.current.map((arq, i) => (
              <div key={i} style={s.cardFile}>
                <CheckCircle size={10} color="#00ff00"/>
                <div style={s.fileInfo}>
                  <span style={s.fileName}>{arq.nome}</span>
                  <small style={{color:'#333'}}>{arq.hora}</small>
                </div>
              </div>
            ))}
            {listaDeArquivos.current.length === 0 && (
              <div style={s.empty}>Arraste os ficheiros aqui...</div>
            )}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <h2>Monitorização de Auditoria</h2>
          <label style={s.btnUpload}>
            <Upload size={18}/> CARREGAR DOCUMENTOS
            <input type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
          </label>
        </header>

        <div style={s.tabelaBox}>
          <table style={s.table}>
            <thead>
              <tr style={s.th}>
                <th style={{padding:'15px'}}>CÓD</th>
                <th>REQUISITO DA LICENÇA</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.tdCod}>{it.codigo}</td>
                  <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                  <td style={s.tdStatus}>
                    {listaDeArquivos.current.length > 0 ? '✅' : '⚪'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'monospace' },
  side: { width: '280px', background: '#000', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', padding: '20px' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#00ff00', marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center' },
  stats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' },
  statItem: { background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid #111' },
  listaContainer: { flex: 1, display: 'flex', flexDirection: 'column', background: '#030303', borderRadius: '10px', border: '1px solid #111', overflow: 'hidden' },
  listaHeader: { padding: '12px', fontSize: '10px', color: '#444', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  scroll: { flex: 1, overflowY: 'auto', padding: '10px' },
  cardFile: { display: 'flex', gap: '10px', alignItems: 'center', padding: '8px', borderBottom: '1px solid #0a0a0a', marginBottom: '5px' },
  fileInfo: { display: 'flex', flexDirection: 'column' },
  fileName: { fontSize: '10px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '180px' },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#222', fontSize: '12px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  btnUpload: { background: '#00ff00', color: '#000', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '10px', fontSize: '12px' },
  tabelaBox: { background: '#080808', borderRadius: '15px', border: '1px solid #111' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', color: '#333', fontSize: '11px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '15px', color: '#00ff00', fontWeight: 'bold' },
  tdDesc: { fontSize: '12px', color: '#888' },
  tdStatus: { textAlign: 'center' }
};
