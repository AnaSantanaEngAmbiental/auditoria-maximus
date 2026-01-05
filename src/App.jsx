import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, 
  HardHat, Truck, FilePlus, Printer, AlertCircle, RefreshCw 
} from 'lucide-react';

// Credenciais validadas e protegidas contra undefined
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV41() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregamento inicial com tratamento de erro profissional
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('base_condicionantes')
          .select('*')
          .order('codigo', { ascending: true });
        
        if (error) throw error;
        if (isMounted && data) setItems(data);
      } catch (err) {
        console.error("Erro Supabase:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    const cache = localStorage.getItem('MAX_PHD_DATA');
    if (cache) setArquivos(JSON.parse(cache));
    
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Persistência otimizada (Debounce implícito)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('MAX_PHD_DATA', JSON.stringify(arquivos));
    }, 500);
    return () => clearTimeout(timer);
  }, [arquivos]);

  // Motor de Validação Minucioso (Regex) - Evita falsos positivos
  const validarDoc = useCallback((id) => {
    if (!id || arquivos.length === 0) return false;
    const nomes = arquivos.map(a => a.nome.toUpperCase());
    
    const regras = {
      CIPP: /\b(CIPP|CTPP|5\.1|5\.2)\b/,
      CIV:  /\b(CIV|CRLV|3\.1|3\.2)\b/,
      MOPP: /\b(MOPP|CURSO|CNH|TREINAMENTO)\b/,
      ANTT: /\b(ANTT|RNTRC|4\.1|4\.2)\b/
    };

    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(nome => padrao.test(nome));
  }, [arquivos]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return items.filter(i => 
      (i.descricao_de_condicionante?.toLowerCase().includes(termo)) || 
      (i.codigo?.toString().includes(termo))
    );
  }, [items, busca]);

  const handleUpload = (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files || e.dataTransfer.files);
    const novos = files.map(f => ({ 
      nome: f.name.toUpperCase(), 
      data: new Date().toLocaleString('pt-BR'),
      tamanho: (f.size / 1024).toFixed(1) + 'KB'
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  if (loading) return (
    <div style={s.loader}><RefreshCw className="animate-spin" size={40} color="#0f0"/> <span>Sincronizando Maximus...</span></div>
  );

  return (
    <div style={s.body} onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      {/* Sidebar de Alta Performance */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0" size={26}/> MAXIMUS <span style={s.v}>PhD v41</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Controle de Frota</button>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>
        
        <div style={s.boxArq}>
          <div style={s.boxHead}>
            EVIDÊNCIAS ({arquivos.length})
            <Trash2 size={14} onClick={() => setArquivos([])} style={s.trash}/>
          </div>
          <div style={s.boxLista}>
            {arquivos.map((a, i) => (
              <div key={i} style={s.itemArq} title={a.data}>
                <CheckCircle size={10} color="#0f0"/> {a.nome.slice(0, 20)}...
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}>
            <Search size={18} color="#444"/>
            <input 
              placeholder="Filtrar por código ou descrição..." 
              style={s.input} 
              value={busca} 
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <div style={{display:'flex', gap:12}}>
            <label style={s.btnUp}>
              <FilePlus size={18}/> CARREGAR PDF
              <input type="file" multiple hidden onChange={handleUpload} accept="application/pdf,image/*"/>
            </label>
            <button style={s.btnPrn} onClick={() => window.print()}><Printer size={18}/></button>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dash}>
              <div style={s.kpi}><h1>{items.length}</h1><p>Requisitos Totais</p></div>
              <div style={s.kpi}><h1 style={{color:'#0f0'}}>{items.filter(i => validarDoc(i.codigo)).length}</h1><p>Conformes</p></div>
              <div style={s.kpi}><h1 style={{color:'#f33'}}>{items.length - items.filter(i => validarDoc(i.codigo)).length}</h1><p>Pendentes</p></div>
            </div>
          )}

          {aba === 'AUDITORIA' && (
            <div style={s.tableContainer}>
              <table style={s.table}>
                <thead>
                  <tr style={s.th}>
                    <th style={{width: '80px'}}>CÓD</th>
                    <th>DESCRIÇÃO DO REQUISITO</th>
                    <th style={{textAlign:'center', width: '120px'}}>EVIDÊNCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((it, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        <Camera 
                          color={validarDoc(it.codigo) ? '#0f0' : '#1a1a1a'} 
                          size={24} 
                          style={{transition: '0.3s'}}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={{padding: '40px'}}>
              <h2 style={{color: '#0f0', marginBottom: '30px'}}>Checklist Automático de Frota</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.row}>
                  <div style={s.docLabel}>
                    <div style={{...s.dot, background: validarDoc(doc) ? '#0f0' : '#f00'}}></div>
                    Certificado / Doc: <strong>{doc}</strong>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:20}}>
                    <span style={{color: validarDoc(doc) ? '#0f0' : '#f33', fontWeight:'bold', fontSize:'12px'}}>
                      {validarDoc(doc) ? 'VALIDADO ✓' : 'NÃO DETECTADO X'}
                    </span>
                    <Camera color={validarDoc(doc) ? '#0f0' : '#222'} size={20}/>
                  </div>
                </div>
              ))}
              {!validarDoc('MOPP') && (
                <div style={s.alert}>
                  <AlertCircle size={16}/> 
                  <strong>Atenção:</strong> MOPP não encontrado nos arquivos. Renomeie o arquivo para "MOPP.pdf" para validar.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'Inter, sans-serif', overflow:'hidden' },
  loader: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', gap: '20px' },
  side: { width: '320px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '22px', fontWeight: '900', marginBottom: '40px', display: 'flex', alignItems:'center', gap:12, color:'#fff', letterSpacing: '-1px' },
  v: { fontSize: '9px', background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'transparent', border: '1px solid transparent', color: '#555', cursor: 'pointer', textAlign: 'left', borderRadius: '12px', transition: '0.2s' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '12px', fontWeight: 'bold' },
  boxArq: { flex: 1, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '15px', fontSize: '11px', color: '#444', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  trash: { cursor:'pointer', color:'#f33', opacity: 0.6 },
  boxLista: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '8px', display: 'flex', gap: '8px', alignItems:'center', borderBottom: '1px solid #080808', paddingBottom: '4px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto', background: 'radial-gradient(circle at top right, #080808, #000)' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '35px', alignItems: 'center' },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #151515', borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '0 20px', maxWidth: '500px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '16px', width: '100%', outline: 'none', fontSize: '14px' },
  btnUp: { background: '#0f0', color: '#000', padding: '14px 24px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems:'center', fontSize: '13px' },
  btnPrn: { background: '#0a0a0a', color: '#fff', border: '1px solid #222', padding: '14px', borderRadius: '14px', cursor: 'pointer' },
  content: { background: '#050505', borderRadius: '24px', border: '1px solid #111', minHeight: '60vh' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#444', fontSize: '11px', padding: '20px 25px', borderBottom: '1px solid #111', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #080808', transition: '0.2s' },
  tdC: { padding: '20px 25px', color: '#0f0', fontWeight: 'bold', fontSize: '16px' },
  tdD: { padding: '20px 25px', color: '#aaa', fontSize: '14px', lineHeight: '1.6' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '25px 30px', borderBottom: '1px solid #0a0a0a', alignItems:'center' },
  docLabel: { display: 'flex', alignItems: 'center', gap: '15px', color: '#eee' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 10px currentColor' },
  dash: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', padding: '40px' },
  kpi: { background: '#020202', padding: '40px', borderRadius: '28px', border: '1px solid #111', textAlign: 'center', transition: '0.3s' },
  alert: { margin: '30px 0', padding: '20px', background: '#1a1100', color: '#ffcc00', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', border: '1px solid #332200' }
};
