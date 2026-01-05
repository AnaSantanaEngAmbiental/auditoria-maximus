import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, Camera, Truck, FileText, CheckCircle } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV26() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (data && data.length > 0) setItems(data);
        else setItems([{codigo: 0, descricao_de_condicionante: 'Aguardando dados do Supabase...'}]);
      } catch (e) {
        console.error("Erro no Banco, modo offline ativo.");
      }
      setLoading(false);
    }
    init();
  }, []);

  // MOTOR DE CAPTURA (Arraste ou Clique)
  const capturar = (e) => {
    const files = e.target?.files || e.dataTransfer?.files;
    if (!files) return;
    
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleTimeString()
    }));
    
    setArquivos(prev => [...prev, ...novos]);
    alert(`${files.length} arquivo(s) carregados com sucesso!`);
  };

  const checkDoc = (tag) => arquivos.some(a => a.nome.includes(tag)) ? '🟢 OK' : '🔴 PENDENTE';

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={(e) => { e.preventDefault(); capturar(e); }}>
      {/* SIDEBAR */}
      <nav style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>Auditoria Técnica</button>
        <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>Frota / CIPP</button>
        <div style={s.counter}>Arquivos: {arquivos.length}</div>
      </nav>

      {/* CONTEÚDO */}
      <main style={s.main}>
        <header style={s.head}>
          <h1>Posto Ipiranga - Gestão Ambiental</h1>
          <label style={s.dropzone}>
            <Upload size={20}/> CLIQUE PARA SUBIR OU SOLTE OS ARQUIVOS AQUI
            <input type="file" multiple hidden onChange={capturar} />
          </label>
        </header>

        <section style={s.card}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead>
                <tr style={s.th}>
                  <th>CÓD</th>
                  <th>REQUISITO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={{color:'#00ff00'}}>{it.codigo}</td>
                    <td style={{fontSize:13, color:'#999'}}>{it.descricao_de_condicionante}</td>
                    <td><Camera size={18} color={arquivos.length > 0 ? '#00ff00' : '#1a1a1a'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{padding:40}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(d => (
                <div key={d} style={s.row}>
                  <span>Documento {d}:</span>
                  <span style={{fontWeight:'bold'}}>{checkDoc(d)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'sans-serif' },
  side: { width: '220px', background: '#000', borderRight: '1px solid #111', padding: '20px' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', gap: '10px' },
  btn: { width: '100%', padding: '15px', background: 'none', border: 'none', color: '#444', textAlign: 'left', cursor: 'pointer' },
  btnA: { width: '100%', padding: '15px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', textAlign: 'left', borderRadius: '8px' },
  counter: { marginTop: '20px', fontSize: '12px', color: '#666', borderTop: '1px solid #111', paddingTop: '10px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  dropzone: { border: '2px dashed #00ff00', padding: '15px 30px', borderRadius: '12px', color: '#00ff00', cursor: 'pointer', display: 'flex', gap: '15px', background: 'rgba(0,255,0,0.02)' },
  card: { background: '#080808', borderRadius: '15px', border: '1px solid #111' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', fontSize: '11px', color: '#333' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#0a0a0a', marginBottom: '5px', borderRadius: '10px' }
};
