import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Upload, FileText, Trash2, CheckCircle, Camera, Database, 
  Search, Filter, Download, PieChart, HardHat, Truck, AlertTriangle
} from 'lucide-react';

// Credenciais de Produção
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV31() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('DASHBOARD');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // Carregamento de Banco e Cache
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (data) setItems(data);
        const cache = localStorage.getItem('maximus_cache_v31');
        if (cache) setArquivos(JSON.parse(cache));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Persistência em Tempo Real
  useEffect(() => {
    localStorage.setItem('maximus_cache_v31', JSON.stringify(arquivos));
  }, [arquivos]);

  // Motor de Validação Cruzada (Aprimorado)
  const checarStatus = useCallback((id) => {
    return arquivos.some(arq => {
      const nome = arq.nome.replace(/\s/g, '').toUpperCase();
      const idBusca = id.toString().toUpperCase();
      if (idBusca === 'CIPP' && (nome.includes('CIPP') || nome.includes('CTPP'))) return true;
      return nome.includes(idBusca);
    });
  }, [arquivos]);

  // Gestão de Upload
  const handleFiles = (e) => {
    const raw = Array.from(e.target.files || e.dataTransfer.files);
    const novos = raw.map(f => ({
      nome: f.name.toUpperCase(),
      hora: new Date().toLocaleTimeString()
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  // Filtro de Interface
  const filtrados = useMemo(() => {
    return items.filter(it => {
      const matchTexto = it.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || it.codigo?.toString().includes(busca);
      const isOk = checarStatus(it.codigo);
      if (filtroStatus === 'VALIDADO') return matchTexto && isOk;
      if (filtroStatus === 'PENDENTE') return matchTexto && !isOk;
      return matchTexto;
    });
  }, [items, busca, filtroStatus, arquivos, checarStatus]);

  if (loading) return <div style={{background:'#000', height:'100vh', color:'#0f0', display:'flex', alignItems:'center', justifyContent:'center'}}>INICIALIZANDO MAXIMUS...</div>;

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); handleFiles(e);}}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00"/> MAXIMUS <span style={s.badge}>v31</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota</button>
        </nav>
        <div style={s.fileBox}>
          <div style={s.fileHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={12} onClick={() => setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.fileScroll}>
            {arquivos.map((a, i) => <div key={i} style={s.fileItem}><CheckCircle size={10} color="#00ff00"/> {a.nome.substring(0,20)}</div>)}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.top}>
          <div style={s.searchWrap}><Search size={18} color="#333"/><input style={s.input} placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:12}}>
            <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="TODOS">Todos Itens</option>
              <option value="VALIDADO">Conformes</option>
              <option value="PENDENTE">Pendentes</option>
            </select>
            <button style={s.btnRelatorio} onClick={() => alert('Relatório Gerado!')}><Download size={18}/> RELATÓRIO</button>
          </div>
        </header>

        <section style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dashGrid}>
              <div style={s.cardKpi}><h2>{items.length}</h2><p>Condicionantes Totais</p></div>
              <div style={s.cardKpi}><h2 style={{color:'#00ff00'}}>{items.filter(i => checarStatus(i.codigo)).length}</h2><p>Conformes</p></div>
              <div style={s.cardKpi}><h2 style={{color:'#ff4444'}}>{items.length - items.filter(i => checarStatus(i.codigo)).length}</h2><p>Pendentes</p></div>
            </div>
          )}

          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>DESCRIÇÃO DA CONDICIONANTE</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={checarStatus(it.codigo) ? '#00ff00' : '#111'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.docRow}>
                  <span>Certificado / Doc: <strong>{doc}</strong></span>
                  <span style={{color: checarStatus(doc) ? '#00ff00' : '#ff4444', fontWeight:'bold'}}>
                    {checarStatus(doc) ? 'VALIDADO ✓' : 'PENDENTE ✗'}
                  </span>
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
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#eee', fontFamily: 'sans-serif' },
  side: { width: '280px', background: '#000', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '40px', display: 'flex', gap: '10px' },
  badge: { background: '#00ff00', color: '#000', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#0a0a0a', border: '1px solid #00ff00', color: '#00ff00', borderRadius: '10px' },
  fileBox: { flex: 1, background: '#020202', borderRadius: '15px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  fileHead: { padding: '12px', fontSize: '10px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  fileScroll: { flex: 1, overflowY: 'auto', padding: '12px' },
  fileItem: { fontSize: '10px', color: '#666', marginBottom: '8px', display: 'flex', gap: '8px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  top: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  searchWrap: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 15px', maxWidth: '400px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #111', borderRadius: '10px', padding: '0 15px' },
  btnRelatorio: { background: '#00ff00', color: '#000', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px' },
  content: { background: '#080808', border: '1px solid #111', borderRadius: '25px' },
  dashGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', padding: '40px' },
  cardKpi: { background: '#000', padding: '30px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', color: '#333', fontSize: '11px', padding: '20px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '20px', color: '#00ff00', fontWeight: 'bold' },
  tdDesc: { fontSize: '13px', color: '#999', padding: '20px' },
  docRow: { display: 'flex', justifyContent: 'space-between', padding: '25px', background: '#050505', marginBottom: '12px', borderRadius: '15px', border: '1px solid #111' }
};
