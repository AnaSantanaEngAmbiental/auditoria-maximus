import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, Camera, Truck, CheckCircle, Trash2 } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusFinalFix() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      setLoading(false);
    }
    carregar();
  }, []);

  // MOTOR CORRIGIDO: Força a atualização da lista na tela
  const processarArquivos = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      tamanho: (f.size / 1024).toFixed(1) + ' KB'
    }));
    
    // Atualiza o estado e só depois mostra o alerta
    setArquivos(prev => {
      const listaAtualizada = [...prev, ...novos];
      setTimeout(() => alert(`${novos.length} arquivos integrados à lista!`), 100);
      return listaAtualizada;
    });
  };

  const temArquivo = (termo) => arquivos.some(a => a.nome.includes(termo.toUpperCase()));

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>AUDITORIA</button>
        <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>FROTA / CIPP</button>
        <button onClick={() => setAba('LISTA')} style={aba === 'LISTA' ? s.btnA : s.btn}>ARQUIVOS ({arquivos.length})</button>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <h2>Gestão Ambiental Integrada</h2>
          <label style={s.upload}>
            <Upload size={18}/> CLIQUE OU ARRASTE
            <input type="file" multiple hidden onChange={e => processarArquivos(e.target.files)} />
          </label>
        </header>

        <div style={s.card}>
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th>EVIDÊNCIA</th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={{color:'#00ff00', fontWeight:'bold'}}>{it.codigo}</td>
                    <td style={{fontSize:12, color:'#ccc'}}>{it.descricao_de_condicionante}</td>
                    <td><Camera color={arquivos.length > 0 ? '#00ff00' : '#222'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:20}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>{doc}</span>
                  <span style={{color: temArquivo(doc) ? '#00ff00' : '#ff4444'}}>
                    {temArquivo(doc) ? '🟢 VALIDADO' : '🔴 PENDENTE'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {aba === 'LISTA' && (
            <div style={{padding:20}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                <h3>Ficheiros na Memória</h3>
                <button onClick={() => setArquivos([])} style={{background:'none', border:'none', color:'#ff4444', cursor:'pointer'}}><Trash2 size={16}/></button>
              </div>
              {arquivos.map((arq, i) => (
                <div key={i} style={s.fileItem}>
                  <CheckCircle size={14} color="#00ff00"/> {arq.nome} <small style={{color:'#444'}}>({arq.tamanho})</small>
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
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'sans-serif' },
  side: { width: '220px', background: '#000', padding: '20px', borderRight: '1px solid #111' },
  logo: { fontSize: '18px', fontWeight: 'bold', marginBottom: '40px', color: '#00ff00', display: 'flex', gap: '10px' },
  btn: { width: '100%', padding: '15px', background: 'none', border: 'none', color: '#444', textAlign: 'left', cursor: 'pointer' },
  btnA: { width: '100%', padding: '15px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', textAlign: 'left', borderRadius: '8px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  upload: { background: '#00ff00', color: '#000', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: 'bold', fontSize: '12px' },
  card: { background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', fontSize: '11px', color: '#444', padding: '15px' },
  tr: { borderBottom: '1px solid #111' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#050505', marginBottom: '5px', borderRadius: '8px', border: '1px solid #111' },
  fileItem: { padding: '10px', fontSize: '11px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }
};
