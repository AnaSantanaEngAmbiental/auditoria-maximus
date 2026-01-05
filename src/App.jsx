import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, FilePlus, Printer, AlertCircle } from 'lucide-react';

// Configuração do Banco de Dados
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV37() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');

  // 1. Carregamento Inicial e Cache (Funcionalidade de Persistência)
  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('base_condicionantes').select('*');
      if (data) setItems(data);
      const cache = localStorage.getItem('MAXIMUS_PHD_V37');
      if (cache) setArquivos(JSON.parse(cache));
    }
    init();
  }, []);

  // 2. Salvar Cache Automaticamente
  useEffect(() => {
    localStorage.setItem('MAXIMUS_PHD_V37', JSON.stringify(arquivos));
  }, [arquivos]);

  // 3. Motor de Validação Total (Lógica para CIPP, CIV, MOPP, ANTT)
  const checar = (id) => {
    if (!id || arquivos.length === 0) return false;
    const listaNomes = arquivos.map(a => a.nome.toUpperCase()).join(' ');
    const termo = id.toString().toUpperCase();
    
    // Regras de De-Para (Tratamento de nomes de arquivos)
    if (termo === 'CIPP') return listaNomes.includes('CIPP') || listaNomes.includes('CTPP') || listaNomes.includes('5.1') || listaNomes.includes('5.2');
    if (termo === 'CIV') return listaNomes.includes('CIV') || listaNomes.includes('CRLV') || listaNomes.includes('3.1') || listaNomes.includes('3.2');
    if (termo === 'MOPP') return listaNomes.includes('MOPP') || listaNomes.includes('CURSO') || listaNomes.includes('TREINAMENTO') || listaNomes.includes('CNH');
    if (termo === 'ANTT') return listaNomes.includes('ANTT') || listaNomes.includes('RNTRC') || listaNomes.includes('4.1') || listaNomes.includes('4.2');
    
    return listaNomes.includes(termo);
  };

  // 4. Filtro de Busca
  const filtrados = useMemo(() => {
    return items.filter(i => 
      i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || 
      i.codigo?.toString().includes(busca)
    );
  }, [items, busca]);

  // 5. Upload de Arquivos (Detectar 13 arquivos ou mais)
  const handleUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ 
      nome: f.name.toUpperCase(), 
      data: new Date().toLocaleDateString() 
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      {/* BARRA LATERAL */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0" size={24}/> MAXIMUS PhD <span style={s.v}>v37</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>
        
        <div style={s.boxArq}>
          <div style={s.boxHead}>
            EVIDÊNCIAS ({arquivos.length}) 
            <Trash2 size={14} onClick={() => {if(confirm('Limpar tudo?')) setArquivos([])}} style={{cursor:'pointer', color:'#f00'}}/>
          </div>
          <div style={s.boxLista}>
            {arquivos.map((a, i) => (
              <div key={i} style={s.itemArq}>
                <CheckCircle size={10} color="#0f0"/> {a.nome.substring(0,25)}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}>
            <Search size={18} color="#333"/>
            <input placeholder="Pesquisar requisito..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
          <div style={{display:'flex', gap:10}}>
            <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
            <button style={s.btnPrn} onClick={() => window.print()}><Printer size={18}/></button>
          </div>
        </header>

        <div style={s.content}>
          {/* ABA DASHBOARD */}
          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Requisitos Totais</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => checar(i.codigo)).length}</h1><p>Em Conformidade</p></div>
              <div style={s.kpi}><h1 style={{color: (items.length - items.filter(i => checar(i.codigo)).length) > 0 ? '#f00' : '#0f0'}}>
                {items.length - items.filter(i => checar(i.codigo)).length}</h1><p>Pendências</p></div>
            </div>
          )}

          {/* ABA AUDITORIA */}
          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>DESCRIÇÃO DO REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdC}>{it.codigo}</td>
                    <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={checar(it.codigo) ? '#0f0' : '#1a1a1a'} size={24}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ABA FROTA */}
          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              <h2 style={{color:'#0f0', marginBottom:30}}>Checklist Automático de Veículos</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>Certificado / Documento: <strong>{doc}</strong></span>
                  <div style={{display:'flex', alignItems:'center', gap:15}}>
                    <span style={{color: checar(doc) ? '#0f0' : '#f00', fontWeight:'bold', fontSize:'14px'}}>
                      {checar(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}
                    </span>
                    <Camera color={checar(doc) ? '#0f0' : '#222'} size={20}/>
                  </div>
                </div>
              ))}
              {!checar('MOPP') && (
                <div style={s.alert}><AlertCircle size={16}/> MOPP ainda não detectado. Suba um arquivo com "MOPP" no nome.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow:'hidden' },
  side: { width: '320px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '22px', fontWeight: 'bold', marginBottom: '45px', display: 'flex', alignItems:'center', gap:12, color:'#0f0' },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '3px 8px', borderRadius: '5px', fontWeight:'bold' },
  nav: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '45px' },
  btn: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left', borderRadius: '12px', fontWeight:'bold', transition:'0.3s' },
  btnA: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '12px', fontWeight:'bold' },
  boxArq: { flex: 1, background: '#020202', borderRadius: '25px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '18px', fontSize: '11px', color: '#444', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight:'bold', letterSpacing:'1px' },
  boxLista: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '12px', display: 'flex', gap: '10px', borderBottom: '1px solid #080808', paddingBottom:8, alignItems:'center' },
  main: { flex: 1, padding: '50px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '50px', gap:30 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '18px', display: 'flex', alignItems: 'center', padding: '0 30px', maxWidth: '500px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none', fontSize:'15px' },
  btnUp: { background: '#0f0', color: '#000', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '12px', alignItems:'center', transition:'0.3s' },
  btnPrn: { background: '#111', color: '#fff', border: '1px solid #222', padding: '15px', borderRadius: '15px', cursor: 'pointer' },
  content: { background: '#050505', borderRadius: '35px', border: '1px solid #111', minHeight:'60vh' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '12px', padding: '30px', borderBottom: '1px solid #111', textTransform:'uppercase', letterSpacing:'1px' },
  tr: { borderBottom: '1px solid #080808', transition:'0.2s' },
  tdC: { padding: '30px', color: '#0f0', fontWeight: 'bold', fontSize: '20px' },
  tdD: { padding: '30px', color: '#aaa', fontSize: '15px', lineHeight: '1.7' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '35px', borderBottom: '1px solid #111', alignItems:'center' },
  dash: { display: grid, gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', padding: '50px' },
  kpi: { background: '#000', padding: '50px', borderRadius: '30px', border: '1px solid #111', textAlign: 'center' },
  alert: { margin: '20px 0', padding: '15px', background: '#1a1100', color: '#ff9900', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }
};
