import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, FileText, Camera, Truck, CheckCircle, Trash2, Database } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusConsolidado() {
  const [data, setData] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: res } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (res) setData(res);
      setLoading(false);
    }
    load();
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), tipo: f.type }));
    setArquivos(prev => [...prev, ...novos]);
  }, []);

  const checkDoc = (nome) => arquivos.some(a => a.nome.includes(nome)) ? '🟢 OK' : '🔴 PENDENTE';

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
      {/* SIDEBAR FIXA */}
      <nav style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><FileText size={18}/> Auditoria</button>
        <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / ANTT</button>
        <button onClick={() => setAba('ARQUIVOS')} style={aba === 'ARQUIVOS' ? s.btnA : s.btn}><Database size={18}/> Nuvem ({arquivos.length})</button>
        
        <div style={s.footerSide}>
          <div style={s.perfil}>PS</div>
          <span style={{fontSize:10}}>Philipe Santana<br/>Consultoria Pará</span>
        </div>
      </nav>

      {/* ÁREA DE CONTEÚDO */}
      <main style={s.main}>
        <header style={s.head}>
          <div>
            <h2 style={{margin:0}}>Painel de Engenharia Ambiental</h2>
            <small style={{color:'#666'}}>Sistema Consolidado v.Final</small>
          </div>
          <div style={s.dropzone}>
            <Upload size={20} color="#00ff00"/> SOLTE PDF/FOTOS AQUI
          </div>
        </header>

        {loading ? <div style={{padding:40, color:'#00ff00'}}>Sincronizando Base...</div> : (
          <div style={s.card}>
            {aba === 'AUDITORIA' && (
              <table style={s.table}>
                <thead>
                  <tr style={s.th}>
                    <th>CÓD</th>
                    <th>CONDICIONANTE / REQUISITO SEMAS</th>
                    <th>EVIDÊNCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={{color:'#00ff00', fontWeight:'bold', width:40}}>{item.codigo}</td>
                      <td style={{fontSize:13, color:'#ccc'}}>{item.descricao_de_condicionante}</td>
                      <td><Camera size={18} color={arquivos.length > 0 ? "#00ff00" : "#222"}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aba === 'FROTA' && (
              <div style={{padding:30}}>
                <h3 style={{color:'#00ff00'}}>Checklist Automático de Frota</h3>
                {['CIV', 'CIPP', 'MOPP', 'ANTT'].map(doc => (
                  <div key={doc} style={s.row}>
                    <span>Documentação: <strong>{doc}</strong></span>
                    <span style={{fontWeight:'bold'}}>{checkDoc(doc)}</span>
                  </div>
                ))}
              </div>
            )}

            {aba === 'ARQUIVOS' && (
              <div style={{padding:30}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                  <h3>Arquivos Processados</h3>
                  <button onClick={() => setArquivos([])} style={s.btnClean}><Trash2 size={14}/> Limpar Tudo</button>
                </div>
                {arquivos.map((f, i) => (
                  <div key={i} style={s.fileRow}>● {f.nome}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'Arial, sans-serif' },
  side: { width: '240px', background: '#000', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', marginBottom: '5px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#111', border: '1px solid #222', color: '#00ff00', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', marginBottom: '5px', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  dropzone: { border: '1px dashed #00ff00', padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#00ff00', background: 'rgba(0,255,0,0.02)' },
  card: { background: '#080808', border: '1px solid #111', borderRadius: '15px', minHeight: '70vh' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '10px', color: '#333', borderBottom: '1px solid #111', background: '#000' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #111', background: '#0c0c0c', marginBottom: '5px', borderRadius: '8px' },
  fileRow: { padding: '8px', fontSize: '12px', color: '#666', borderBottom: '1px solid #111' },
  footerSide: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#080808', borderRadius: '10px' },
  perfil: { width: '30px', height: '30px', background: '#00ff00', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  btnClean: { background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }
};
