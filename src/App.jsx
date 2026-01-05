import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, FileText, CheckCircle, Camera, Truck, Trash2 } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusUltra() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [dragAtivo, setDragAtivo] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
    if (data) setItems(data);
    if (error) console.error("Erro ao carregar:", error.message);
  }

  const handleFiles = (files) => {
    const lista = Array.from(files).map(f => ({ nome: f.name.toUpperCase(), hora: new Date().toLocaleTimeString() }));
    setArquivos(prev => [...prev, ...lista]);
    alert(`${files.length} arquivos detectados!`);
  };

  const statusDoc = (termo) => arquivos.some(a => a.nome.includes(termo)) ? '🟢 OK' : '🔴 PENDENTE';

  return (
    <div 
      style={{...s.app, border: dragAtivo ? '5px solid #00ff00' : 'none'}}
      onDragOver={(e) => { e.preventDefault(); setDragAtivo(true); }}
      onDragLeave={() => setDragAtivo(false)}
      onDrop={(e) => { e.preventDefault(); setDragAtivo(false); handleFiles(e.dataTransfer.files); }}
    >
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>AUDITORIA</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>FROTA / CIPP</button>
        </nav>
        <div style={s.stats}>Arquivos: {arquivos.length}</div>
      </aside>

      <main style={s.main}>
        <div style={s.header}>
          <h2>Gestão Ambiental Integrada</h2>
          <label style={s.upload}>
             <Upload size={18}/> CLIQUE OU ARRASTE FICHEIROS
             <input type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>

        <div style={s.card}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead>
                <tr style={s.th}><th>CÓD</th><th>CONDICIONANTE</th><th>EVIDÊNCIA</th></tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={{color:'#00ff00', fontWeight:'bold'}}>{it.codigo}</td>
                    <td style={{fontSize:12, color:'#ccc'}}>{it.descricao_de_condicionante}</td>
                    <td><Camera color={arquivos.length > 0 ? '#00ff00' : '#222'}/></td>
                  </tr>
                )) : <tr><td colSpan="3" style={{padding:20, textAlign:'center'}}>Carregando do Banco...</td></tr>}
              </tbody>
            </table>
          ) : (
            <div style={{padding:30}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(d => (
                <div key={d} style={s.row}>
                  <span>{d} (Certificado/Inspeção)</span>
                  <span>{statusDoc(d)}</span>
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
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'sans-serif', transition: '0.2s' },
  side: { width: '220px', background: '#000', padding: '25px', borderRight: '1px solid #111' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', gap: '10px', color: '#00ff00' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btn: { padding: '15px', background: 'none', border: 'none', color: '#555', textAlign: 'left', cursor: 'pointer' },
  btnA: { padding: '15px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', textAlign: 'left', borderRadius: '8px', fontWeight: 'bold' },
  stats: { marginTop: '40px', fontSize: '12px', color: '#444', borderTop: '1px solid #111', paddingTop: '15px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  upload: { background: '#00ff00', color: '#000', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: 'bold', fontSize: '13px' },
  card: { background: '#0a0a0a', borderRadius: '15px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', fontSize: '11px', color: '#444', padding: '15px' },
  tr: { borderBottom: '1px solid #111' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#050505', marginBottom: '5px', borderRadius: '10px', border: '1px solid #111' }
};
