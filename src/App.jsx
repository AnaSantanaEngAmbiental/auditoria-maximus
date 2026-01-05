import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, FilePlus, Printer, Filter } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV35() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('base_condicionantes').select('*');
      if (data) setItems(data);
      const cache = localStorage.getItem('MAXIMUS_PHD_V35');
      if (cache) setArquivos(JSON.parse(cache));
    }
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('MAXIMUS_PHD_V35', JSON.stringify(arquivos));
  }, [arquivos]);

  const checar = (id) => {
    if (!id || arquivos.length === 0) return false;
    const termo = id.toString().toUpperCase();
    return arquivos.some(a => {
      const n = a.nome.toUpperCase();
      if (termo === 'CIPP' && (n.includes('CIPP') || n.includes('CTPP'))) return true;
      return n.includes(termo);
    });
  };

  const filtrados = useMemo(() => {
    return items.filter(i => {
      const b = i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || i.codigo?.toString().includes(busca);
      const ok = checar(i.codigo);
      if (statusFiltro === 'OK') return b && ok;
      if (statusFiltro === 'PENDENTE') return b && !ok;
      return b;
    });
  }, [items, busca, statusFiltro, arquivos]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), data: new Date().toLocaleDateString() }));
    setArquivos(prev => [...prev, ...novos]);
  };

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS PhD <span style={s.v}>v35</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>
        <div style={s.boxArq}>
          <div style={s.boxHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={12} onClick={() => setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.boxLista}>{arquivos.map((a, i) => <div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.substring(0,22)}</div>)}</div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18} color="#333"/><input placeholder="Buscar..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
            <select style={s.select} onChange={e => setStatusFiltro(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="OK">Conformes</option>
              <option value="PENDENTE">Pendentes</option>
            </select>
            <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
            <button style={s.btnPrn} onClick={() => window.print()}><Printer size={18}/></button>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Itens Totais</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => checar(i.codigo)).length}</h1><p>Conformes</p></div>
              <div style={s.kpi}><h1 style={{color:'#f00'}}>{items.length - items.filter(i => checar(i.codigo)).length}</h1><p>Pendentes</p></div>
            </div>
          )}
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdC}>{it.codigo}</td>
                    <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={checar(it.codigo) ? '#0f0' : '#111'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>Documento: <strong>{doc}</strong></span>
                  <span style={{color: checar(doc) ? '#0f0' : '#f00', fontWeight:'bold'}}>{checar(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}</span>
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
  side: { width: '280px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems:'center', gap:8 },
  v: { fontSize: '9px', background: '#0f0', color: '#000', padding: '2px 5px', borderRadius: '3px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '8px' },
  boxArq: { flex: 1, background: '#020202', borderRadius: '15px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '12px', fontSize: '10px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  boxLista: { flex: 1, overflowY: 'auto', padding: '12px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '8px', display: 'flex', gap: '8px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px', maxWidth: '400px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '14px', width: '100%', outline: 'none' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #111', borderRadius: '10px', padding: '0 10px', fontSize:'12px' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems:'center', fontSize:'12px' },
  btnPrn: { background: '#111', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
  content: { background: '#050505', borderRadius: '25px', border: '1px solid #111' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '11px', padding: '20px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdD: { padding: '20px', color: '#999', fontSize: '13px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '25px', borderBottom: '1px solid #111' },
  dash: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', padding: '40px' },
  kpi: { background: '#000', padding: '40px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' }
};
