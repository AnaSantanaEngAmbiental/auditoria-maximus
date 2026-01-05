import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, FilePlus, Printer, AlertCircle, RefreshCw } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV43() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregamento de dados com tratamento de nulos
  useEffect(() => {
    let montado = true;
    async function carregarDados() {
      try {
        const { data, error } = await supabase
          .from('base_condicionantes')
          .select('codigo, descricao_de_condicionante, status')
          .order('codigo', { ascending: true });
        
        if (!error && montado && data) setItems(data);
      } catch (err) {
        console.error("Erro na carga:", err);
      } finally {
        if (montado) setLoading(false);
      }
    }
    const cache = localStorage.getItem('MAX_V43_FILES');
    if (cache) setArquivos(JSON.parse(cache));
    carregarDados();
    return () => { montado = false; };
  }, []);

  // Salvamento inteligente em cache
  useEffect(() => {
    localStorage.setItem('MAX_V43_FILES', JSON.stringify(arquivos));
  }, [arquivos]);

  // Motor de Validação por Regex (Evita falsos positivos como 'CIVIL' validar 'CIV')
  const validar = useCallback((id) => {
    if (!id || arquivos.length === 0) return false;
    const nomes = arquivos.map(a => a.nome.toUpperCase());
    const regras = {
      CIPP: /\b(CIPP|CTPP|5\.1|5\.2)\b/,
      CIV:  /\b(CIV|CRLV|3\.1|3\.2)\b/,
      MOPP: /\b(MOPP|CURSO|CNH)\b/,
      ANTT: /\b(ANTT|RNTRC|4\.1|4\.2)\b/
    };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  }, [arquivos]);

  // Filtro otimizado para os 424 registros
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return items.filter(i => 
      (i.descricao_de_condicionante?.toLowerCase().includes(termo)) || 
      (i.codigo?.toString().includes(termo))
    );
  }, [items, busca]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ 
      nome: f.name.toUpperCase(), 
      data: new Date().toLocaleDateString('pt-BR') 
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  if (loading) return (
    <div style={s.load}>
      <RefreshCw className="animate-spin" size={30}/> 
      <strong>Sincronizando 424 registros...</strong>
    </div>
  );

  return (
    <div style={s.body} onDragOver={e=>e.preventDefault()} onDrop={handleUpload}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0" size={24}/> MAXIMUS PhD <span style={s.v}>v43</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>
        
        <div style={s.boxArq}>
          <div style={s.boxHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={14} onClick={()=>setArquivos([])} style={{cursor:'pointer', color:'#f00'}}/></div>
          <div style={s.boxLista}>
            {arquivos.map((a, i) => (
              <div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.slice(0,22)}</div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}>
            <Search size={18} color="#444"/>
            <input placeholder="Pesquisar nos 424 requisitos..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
          <div style={{display:'flex', gap:10}}>
            <label style={s.btnUp}><FilePlus size={18}/> ADICIONAR <input type="file" multiple hidden onChange={handleUpload}/></label>
            <button style={s.btnPrn} onClick={() => window.print()}><Printer size={18}/></button>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Itens no Banco</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => validar(i.codigo)).length}</h1><p>Conformes</p></div>
              <div style={s.kpi}><h1 style={{color:'#f00'}}>{items.length - items.filter(i => validar(i.codigo)).length}</h1><p>Pendentes</p></div>
            </div>
          )}

          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>EVIDÊNCIA</th></tr></thead>
                <tbody>
                  {filtrados.map((it, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={validar(it.codigo) ? '#0f0' : '#111'} size={24}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <span>Certificado Obrigatório: <strong>{doc}</strong></span>
                  <div style={{display:'flex', gap:15, alignItems:'center'}}>
                    <span style={{color: validar(doc) ? '#0f0' : '#f00', fontWeight:'bold'}}>{validar(doc) ? 'VALIDADO ✓' : 'PENDENTE X'}</span>
                    <Camera color={validar(doc) ? '#0f0' : '#222'} size={20}/>
                  </div>
                </div>
              ))}
              {!validar('MOPP') && <div style={s.alert}><AlertCircle size={16}/> MOPP não detectado nos arquivos carregados.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow:'hidden' },
  load: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0f0', background: '#000', gap: 15 },
  side: { width: '320px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems:'center', gap:12, color:'#fff' },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '12px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '12px' },
  boxArq: { flex: 1, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  boxLista: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '10px', display: 'flex', gap: '8px', alignItems:'center' },
  main: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '35px', alignItems: 'center' },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #151515', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 25px', maxWidth: '500px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '14px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px' },
  btnPrn: { background: '#111', color: '#fff', border: '1px solid #222', padding: '14px', borderRadius: '12px', cursor: 'pointer' },
  content: { background: '#050505', borderRadius: '30px', border: '1px solid #111', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  scroll: { flex: 1, overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#333', fontSize: '11px', padding: '25px', borderBottom: '1px solid #111', position: 'sticky', top: 0, background: '#050505' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '25px', color: '#0f0', fontWeight: 'bold', fontSize: '18px' },
  tdD: { padding: '25px', color: '#999', fontSize: '14px', lineHeight: '1.6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '30px', borderBottom: '1px solid #111', alignItems:'center' },
  dash: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', padding: '40px' },
  kpi: { background: '#000', padding: '40px', borderRadius: '25px', border: '1px solid #111', textAlign: 'center' },
  alert: { margin: '20px 40px', padding: '15px', background: '#1a1100', color: '#ff9900', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }
};
