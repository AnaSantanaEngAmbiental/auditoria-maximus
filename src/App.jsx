import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, FilePlus, Printer } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV36() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('base_condicionantes').select('*');
      if (data) setItems(data);
      const cache = localStorage.getItem('MAXIMUS_PHD_V36');
      if (cache) setArquivos(JSON.parse(cache));
    }
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('MAXIMUS_PHD_V36', JSON.stringify(arquivos));
  }, [arquivos]);

  // MOTOR DE VALIDAÇÃO TOTAL (Onde a mágica acontece)
  const checar = (id) => {
    if (!id || arquivos.length === 0) return false;
    const termo = id.toString().toUpperCase();
    
    return arquivos.some(a => {
      const n = a.nome.toUpperCase();
      
      // Validação Cruzada de Documentos de Frota
      if (termo === 'CIPP' && (n.includes('CIPP') || n.includes('CTPP') || n.includes('5.1'))) return true;
      if (termo === 'CIV' && (n.includes('CIV') || n.includes('VEICULO') || n.includes('3.1') || n.includes('3.2'))) return true;
      if (termo === 'MOPP' && (n.includes('MOPP') || n.includes('CURSO') || n.includes('TREINAMENTO'))) return true;
      if (termo === 'ANTT' && (n.includes('ANTT') || n.includes('RNTRC') || n.includes('4.1') || n.includes('4.2'))) return true;
      
      // Validação de Auditoria por Código
      return n.includes(termo);
    });
  };

  const filtrados = useMemo(() => {
    return items.filter(i => 
      i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || 
      i.codigo?.toString().includes(busca)
    );
  }, [items, busca]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), data: new Date().toLocaleDateString() }));
    setArquivos(prev => [...prev, ...novos]);
  };

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS PhD <span style={s.v}>v36</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>
        <div style={s.boxArq}>
          <div style={s.boxHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={12} onClick={() => setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.boxLista}>{arquivos.map((a, i) => <div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.substring(0,25)}</div>)}</div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18} color="#333"/><input placeholder="Filtrar..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
            <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
            <button style={s.btnPrn} onClick={() => window.print()}><Printer size={18}/></button>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Requisitos</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => checar(i.codigo)).length}</h1><p>Conformes</p></div>
              <div style={s.kpi}><h1 style={{color: items.length - items.filter(i => checar(i.codigo)).length > 0 ? '#f00' : '#0f0'}}>
                {items.length - items.filter(i => checar(i.codigo)).length}</h1><p>Pendentes</p></div>
            </div>
          )}
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdC}>{it.codigo}</td>
                    <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={checar(it.codigo) ? '#0f0' : '#222'} size={24}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>Certificado/Documento: <strong>{doc}</strong></span>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{color: checar(doc) ? '#0f0' : '#f00', fontWeight:'bold'}}>{checar(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}</span>
                    <Camera color={checar(doc) ? '#0f0' : '#222'} size={20}/>
                  </div>
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
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif' },
  side: { width: '300px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems:'center', gap:10 },
  v: { fontSize: '9px', background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontWeight:'bold' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '10px', fontWeight:'bold' },
  boxArq: { flex: 1, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight:'bold' },
  boxLista: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '10px', display: 'flex', gap: '8px', borderBottom: '1px solid #080808', paddingBottom:5 },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', gap:20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 25px', maxWidth: '450px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems:'center' },
  btnPrn: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '12px', cursor: 'pointer' },
  content: { background: '#050505', borderRadius: '30px', border: '1px solid #111' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '11px', padding: '25px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: '18px' },
  tdD: { padding: '25px', color: '#999', fontSize: '14px', lineHeight: '1.6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '30px', borderBottom: '1px solid #111', alignItems:'center' },
  dash: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', padding: '40px' },
  kpi: { background: '#000', padding: '45px', borderRadius: '25px', border: '1px solid #111', textAlign: 'center' }
};
