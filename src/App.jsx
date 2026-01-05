import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, Camera, FileText, CheckCircle, Trash2, Database } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV27() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');

  // 1. Carregar dados do Banco e do Cache Local ao abrir
  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      const salvos = localStorage.getItem('maximus_arquivos');
      if (salvos) setArquivos(JSON.parse(salvos));
    }
    init();
  }, []);

  // 2. Salvar no Cache sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem('maximus_arquivos', JSON.stringify(arquivos));
  }, [arquivos]);

  const processar = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      tamanho: (f.size / 1024).toFixed(0) + 'KB'
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const limparTudo = () => {
    if(window.confirm("Limpar lista de arquivos?")) {
      setArquivos([]);
      localStorage.removeItem('maximus_arquivos');
    }
  };

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); processar(e.dataTransfer.files); }}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        
        <div style={s.menu}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>
            <FileText size={16}/> Auditoria
          </button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>
            <Database size={16}/> Frota / CIPP
          </button>
        </div>

        <div style={s.listaBox}>
          <div style={s.listaHead}>
            <span>ARQUIVOS ({arquivos.length})</span>
            <Trash2 size={14} onClick={limparTudo} style={{cursor:'pointer', color:'#ff4444'}}/>
          </div>
          <div style={s.scrollArea}>
            {arquivos.map((arq, i) => (
              <div key={i} style={s.fileBadge}>
                <CheckCircle size={10} color="#00ff00"/> {arq.nome.substring(0, 20)}...
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <h2>Painel de Controle Ambiental</h2>
          <label style={s.dropzone}>
            <Upload size={20}/> <strong>CLIQUE OU SOLTE OS ARQUIVOS</strong>
            <input type="file" multiple hidden onChange={e => processar(e.target.files)} />
          </label>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th>STATUS</th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={{color:'#00ff00', fontWeight:'bold'}}>{it.codigo}</td>
                    <td style={{fontSize:13, color:'#999'}}>{it.descricao_de_condicionante}</td>
                    <td><Camera color={arquivos.length > 0 ? '#00ff00' : '#222'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{padding:30}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(d => (
                <div key={d} style={s.docRow}>
                  <span>Certificado {d}</span>
                  <span style={{color: arquivos.some(a => a.nome.includes(d)) ? '#00ff00' : '#ff4444'}}>
                    {arquivos.some(a => a.nome.includes(d)) ? 'VALIDADO ✓' : 'PENDENTE ✗'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#eee', fontFamily: 'monospace' },
  side: { width: '240px', background: '#000', padding: '20px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#00ff00', marginBottom: '30px', display: 'flex', gap: '10px' },
  menu: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '30px' },
  btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left' },
  btnA: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', borderRadius: '5px', cursor: 'pointer' },
  listaBox: { flex: 1, background: '#080808', borderRadius: '10px', padding: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  listaHead: { fontSize: '10px', color: '#333', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' },
  scrollArea: { overflowY: 'auto', flex: 1 },
  fileBadge: { fontSize: '9px', padding: '5px', borderBottom: '1px solid #111', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  dropzone: { border: '2px dashed #00ff00', padding: '15px 25px', borderRadius: '10px', color: '#00ff00', cursor: 'pointer', textAlign: 'center', display: 'flex', gap: '10px' },
  content: { background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#333', fontSize: '11px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  docRow: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#050505', marginBottom: '10px', border: '1px solid #111', borderRadius: '8px' }
};
