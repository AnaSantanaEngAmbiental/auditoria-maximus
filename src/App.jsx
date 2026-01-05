import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, FileCheck, Truck, Camera, Trash2 } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV25() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
    if (data) setItems(data);
  }

  // MOTOR DE CAPTURA DUPLO (Arraste ou Clique)
  const processarArquivos = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      tamanho: (f.size / 1024).toFixed(0) + 'KB'
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) processarArquivos(e.dataTransfer.files);
  };

  return (
    <div 
      style={s.app} 
      onDragOver={e => e.preventDefault()} 
      onDrop={handleDrop}
    >
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}><Shield color="#2ecc71"/> MAXIMUS PhD</div>
        <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>AUDITORIA</button>
        <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>FROTA / CIPP</button>
        
        <div style={s.status}>
          <p>Arquivos Lidos: <strong>{arquivos.length}</strong></p>
          <button onClick={() => setArquivos([])} style={s.btnClean}><Trash2 size={12}/> Limpar</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        <header style={s.header}>
          <h2>Painel de Engenharia Ambiental</h2>
          {/* PLANO B: Clique para upload se o arraste falhar */}
          <label style={s.uploadBtn}>
            <Upload size={16}/> CLIQUE OU ARRASTE ARQUIVOS
            <input 
              type="file" 
              multiple 
              style={{display:'none'}} 
              onChange={(e) => processarArquivos(e.target.files)}
            />
          </label>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>CÓD</th>
                  <th style={s.th}>DESCRIÇÃO DA CONDICIONANTE</th>
                  <th style={s.th}>DOC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdC}>{item.codigo}</td>
                    <td style={s.tdD}>{item.descricao_de_condicionante}</td>
                    <td><Camera color={arquivos.length > 0 ? "#2ecc71" : "#222"}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{padding:20}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>{doc}</span>
                  <span style={{color: arquivos.some(a => a.nome.includes(doc)) ? '#2ecc71' : '#ff4444'}}>
                    {arquivos.some(a => a.nome.includes(doc)) ? '● RECEBIDO' : '○ PENDENTE'}
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
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '220px', background: '#080808', padding: '20px', borderRight: '1px solid #111' },
  logo: { fontSize: '18px', fontWeight: 'bold', marginBottom: '30px', color: '#2ecc71', display: 'flex', gap: '10px' },
  btn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#444', textAlign: 'left', cursor: 'pointer' },
  btnA: { width: '100%', padding: '12px', background: '#111', border: '1px solid #2ecc71', color: '#2ecc71', textAlign: 'left', borderRadius: '8px' },
  status: { marginTop: '40px', padding: '10px', fontSize: '12px', borderTop: '1px solid #111' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  uploadBtn: { background: '#2ecc71', color: '#000', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  content: { background: '#050505', border: '1px solid #111', borderRadius: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', fontSize: '11px', color: '#333', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #0a0a0a' },
  tdC: { padding: '15px', color: '#2ecc71', fontWeight: 'bold' },
  tdD: { padding: '15px', fontSize: '13px', color: '#999' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #111' },
  btnClean: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' }
};
