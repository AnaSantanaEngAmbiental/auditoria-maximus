import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, FilePlus, AlertCircle } from 'lucide-react';

// Conexão Blindada
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV34() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');

  // 1. CARREGAMENTO E MEMÓRIA (Recupera seus 13 arquivos)
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase.from('base_condicionantes').select('*');
      if (data) setItems(data);
      if (error) console.error("Erro Supabase:", error.message);
    }
    carregar();

    const cache = localStorage.getItem('MAXIMUS_V34_PRO');
    if (cache) setArquivos(JSON.parse(cache));
  }, []);

  useEffect(() => {
    localStorage.setItem('MAXIMUS_V34_PRO', JSON.stringify(arquivos));
  }, [arquivos]);

  // 2. MOTOR DE BUSCA INTELIGENTE (Cruza nome do arquivo com requisito)
  const validarStatus = (id) => {
    if (!id || arquivos.length === 0) return false;
    const termo = id.toString().toUpperCase();
    return arquivos.some(a => {
      const nome = a.nome.toUpperCase();
      // Regra de Ouro: Valida CIPP se encontrar CTPP no nome do PDF
      if (termo === 'CIPP' && (nome.includes('CIPP') || nome.includes('CTPP'))) return true;
      return nome.includes(termo);
    });
  };

  const handleUpload = (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), data: new Date().toLocaleDateString() }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const filtrados = useMemo(() => {
    return items.filter(i => 
      i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || 
      i.codigo?.toString().includes(busca)
    );
  }, [items, busca]);

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      
      {/* SIDEBAR PERSISTENTE */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS PhD <span style={s.v}>v34</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>

        <div style={s.caixaArquivos}>
          <div style={s.caixaHead}>ARQUIVOS LIDOS ({arquivos.length}) <Trash2 size={14} onClick={() => setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.caixaLista}>
            {arquivos.map((a, i) => (
              <div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.substring(0, 22)}</div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.search}>
            <Search size={18} color="#444"/>
            <input placeholder="Filtrar por código ou texto..." style={s.input} value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <label style={s.btnUpload}>
            <FilePlus size={18}/> CLIQUE OU ARRASTE OS ARQUIVOS
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        </header>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <div style={s.cardPrincipal}>
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.length > 0 ? filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={validarStatus(it.codigo) ? '#0f0' : '#1a1a1a'} size={24}/></td>
                  </tr>
                )) : <tr><td colSpan="3" style={{padding:40, textAlign:'center', color:'#444'}}>Nenhum dado encontrado no Supabase.</td></tr>}
              </tbody>
            </table>
          )}

          {aba === 'FROTA' && (
            <div style={{padding: 40}}>
              <h2 style={{color:'#0f0', marginBottom:30}}>Checklist Automático de Veículos</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.rowDoc}>
                  <span>Certificado Obrigatório: <strong>{doc}</strong></span>
                  <span style={{color: validarStatus(doc) ? '#0f0' : '#f00', fontWeight:'bold'}}>
                    {validarStatus(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Total de Requisitos</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => validarStatus(i.codigo)).length}</h1><p>Em Conformidade</p></div>
              <div style={s.kpi}><h1 style={{color:'#f00'}}>{items.length - items.filter(i => validarStatus(i.codigo)).length}</h1><p>Pendências</p></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'Inter, sans-serif' },
  side: { width: '300px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '22px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems:'center', gap:10 },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' },
  btnA: { display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', background: '#0a0a0a', borderLeft: '4px solid #0f0', color: '#0f0', fontWeight: 'bold' },
  caixaArquivos: { flex: 1, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  caixaHead: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight:'bold' },
  caixaLista: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '10px', display: 'flex', gap: '8px', borderBottom: '1px solid #080808', paddingBottom: 5 },
  main: { flex: 1, padding: '50px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '50px', gap: 20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 25px', maxWidth: '500px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none' },
  btnUpload: { background: '#0f0', color: '#000', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' },
  cardPrincipal: { background: '#050505', borderRadius: '30px', border: '1px solid #111', minHeight: '500px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '11px', padding: '25px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: '16px' },
  tdDesc: { padding: '25px', color: '#999', fontSize: '14px', lineHeight: '1.6' },
  rowDoc: { display: 'flex', justifyContent: 'space-between', padding: '30px', borderBottom: '1px solid #111', alignItems: 'center' },
  dash: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', padding: '50px' },
  kpi: { background: '#000', padding: '50px', borderRadius: '25px', border: '1px solid #111', textAlign: 'center' }
};
