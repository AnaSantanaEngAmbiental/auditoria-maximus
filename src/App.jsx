import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Upload, Trash2, CheckCircle, Camera, Search, 
  Download, PieChart, HardHat, Truck, AlertCircle, FilePlus
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV33() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');

  // 1. CARREGAR E MANTER (A firmeza do código)
  useEffect(() => {
    async function carregarBanco() {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
    }
    carregarBanco();

    const salvo = localStorage.getItem('MAXIMUS_V33_FINAL');
    if (salvo) setArquivos(JSON.parse(salvo));
  }, []);

  useEffect(() => {
    localStorage.setItem('MAXIMUS_V33_FINAL', JSON.stringify(arquivos));
  }, [arquivos]);

  // 2. MOTOR DE VALIDAÇÃO (Reconhece CTPP como CIPP)
  const validar = (id) => {
    if (!id) return false;
    return arquivos.some(a => {
      const n = a.nome.toUpperCase();
      const cod = id.toString().toUpperCase();
      return n.includes(cod) || (cod === 'CIPP' && n.includes('CTPP'));
    });
  };

  // 3. FUNÇÃO DE ARRASTE (Trazendo de volta a facilidade)
  const handleUpload = (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), data: new Date().toLocaleDateString() }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const filtrados = useMemo(() => {
    return items.filter(i => 
      (i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || i.codigo?.includes(busca))
    );
  }, [items, busca]);

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      
      {/* BARRA LATERAL */}
      <aside style={s.sidebar}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS PhD <small>v33</small></div>
        
        <div style={s.menu}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </div>

        <div style={s.fileCard}>
          <div style={s.fileHeader}>ARQUIVOS LIDOS ({arquivos.length}) <Trash2 size={14} onClick={() => setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.fileList}>
            {arquivos.map((a, i) => (
              <div key={i} style={s.fileItem}><CheckCircle size={10} color="#0f0"/> {a.nome.substring(0, 20)}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={18} color="#333"/>
            <input placeholder="Buscar condicionante..." style={s.input} onChange={e => setBusca(e.target.value)} />
          </div>
          
          {/* BOTÃO DE UPLOAD VISÍVEL - Trazendo de volta o que sumiu */}
          <label style={s.uploadBtn}>
            <FilePlus size={18}/> ADICIONAR ARQUIVOS
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        </header>

        <section style={s.container}>
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO / CONDICIONANTE</th><th style={{textAlign:'center'}}>EVIDÊNCIA</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={validar(it.codigo) ? '#0f0' : '#111'} size={24}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'FROTA' && (
            <div style={{padding: 40}}>
              <h2 style={{color: '#0f0', marginBottom: 20}}>Checklist de Frota</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.rowDoc}>
                  <span>Documentação: <strong>{doc}</strong></span>
                  <span style={{color: validar(doc) ? '#0f0' : '#f00', fontWeight:'bold'}}>
                    {validar(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.cardKpi}><h3>{items.length}</h3><p>Total de Itens</p></div>
              <div style={s.cardKpi}><h3 style={{color:'#0f0'}}>{items.filter(i => validar(i.codigo)).length}</h3><p>Conformes</p></div>
              <div style={s.cardKpi}><h3 style={{color:'#f00'}}>{items.length - items.filter(i => validar(i.codigo)).length}</h3><p>Pendentes</p></div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '280px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', gap: '10px' },
  menu: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#111', borderLeft: '4px solid #0f0', color: '#0f0', fontWeight: 'bold' },
  fileCard: { flex: 1, background: '#020202', borderRadius: '15px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  fileHeader: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  fileList: { flex: 1, overflowY: 'auto', padding: '15px' },
  fileItem: { fontSize: '10px', color: '#666', marginBottom: '10px', display: 'flex', gap: '8px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  searchBox: { flex: 1, background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 20px', maxWidth: '400px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  uploadBtn: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' },
  container: { background: '#050505', borderRadius: '25px', border: '1px solid #111', minHeight: '400px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '11px', padding: '20px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdDesc: { padding: '20px', color: '#999', fontSize: '13px' },
  rowDoc: { display: 'flex', justifyContent: 'space-between', padding: '25px', borderBottom: '1px solid #111' },
  dash: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', padding: '40px' },
  cardKpi: { background: '#000', padding: '35px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' }
};
