import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, File, Check, AlertCircle, HardHat } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV24() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [dragAtivo, setDragAtivo] = useState(false);

  useEffect(() => {
    fetchBase();
  }, []);

  async function fetchBase() {
    const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
    if (data) setItems(data);
  }

  // MOTOR DE ARRASTE REFORÇADO
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragAtivo(true);
    else setDragAtivo(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragAtivo(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processar(files);
  };

  const processar = (files) => {
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), tipo: f.type }));
    setArquivos(prev => [...prev, ...novos]);
    alert(`MAXIMUS: ${files.length} ficheiros integrados com sucesso!`);
  };

  const statusDoc = (tag) => arquivos.some(a => a.nome.includes(tag)) ? '🟢 OK' : '🔴 PENDENTE';

  return (
    <div 
      style={{...s.app, border: dragAtivo ? '4px solid #00ff00' : 'none'}}
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
    >
      {/* SIDEBAR NEGRA */}
      <div style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS PhD</div>
        <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>AUDITORIA TÉCNICA</button>
        <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>FROTA (CIPP/MOPP)</button>
        <div style={s.statusBox}>
          <small>SESSÃO ATIVA</small>
          <div>{arquivos.length} Ficheiros lidos</div>
        </div>
      </div>

      {/* PAINEL PRINCIPAL */}
      <div style={s.main}>
        <div style={s.header}>
          <h2>Posto de Combustível Delta</h2>
          <div style={s.dropZone}>
             <Upload color="#00ff00"/> 
             <span>ARRASTE OS FICHEIROS PARA QUALQUER LUGAR DA TELA</span>
          </div>
        </div>

        <div style={s.card}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>CÓD</th>
                  <th style={s.th}>DESCRIÇÃO DA CONDICIONANTE</th>
                  <th style={s.th}>EVIDÊNCIA</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{item.codigo}</td>
                    <td style={s.tdDesc}>{item.descricao_de_condicionante}</td>
                    <td style={s.tdEvid}>
                       {arquivos.length > 0 ? <Check color="#00ff00"/> : <AlertCircle color="#333"/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={s.frotaContainer}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.docRow}>
                  <span>DOCUMENTO: <strong>{doc}</strong></span>
                  <span style={{fontWeight:'bold'}}>{statusDoc(doc)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: 'monospace' },
  side: { width: '250px', background: '#000', padding: '20px', borderRight: '1px solid #111' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', gap: '10px' },
  btn: { width: '100%', padding: '15px', background: '#0a0a0a', border: 'none', color: '#444', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' },
  btnA: { width: '100%', padding: '15px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' },
  statusBox: { marginTop: '40px', padding: '15px', background: '#080808', borderRadius: '5px', border: '1px solid #111' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  dropZone: { border: '1px dashed #00ff00', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', color: '#00ff00', fontSize: '12px' },
  card: { background: '#080808', border: '1px solid #111', borderRadius: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', color: '#444', borderBottom: '1px solid #111', fontSize: '10px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '15px', color: '#00ff00', fontWeight: 'bold' },
  tdDesc: { padding: '15px', fontSize: '12px', color: '#ccc' },
  tdEvid: { padding: '15px', textAlign: 'center' },
  frotaContainer: { padding: '30px' },
  docRow: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #111', background: '#0a0a0a', marginBottom: '5px' }
};
