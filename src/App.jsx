import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Upload, FileText, Trash2, CheckCircle, Camera, Database, 
  Search, Filter, Download, PieChart, HardHat, Truck, AlertTriangle, RefreshCcw
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV32() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState(() => localStorage.getItem('maximus_aba') || 'DASHBOARD');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // 1. CARREGAMENTO BLINDADO
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (data) setItems(data);
        
        // Recupera arquivos do cache de forma segura
        const cache = localStorage.getItem('maximus_caixa_forte_v32');
        if (cache) {
          const parsed = JSON.parse(cache);
          if (Array.isArray(parsed)) setArquivos(parsed);
        }
      } catch (e) {
        console.error("Erro na carga:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. SALVAMENTO AUTOMÁTICO (Não deixa o código "voltar a zero")
  useEffect(() => {
    localStorage.setItem('maximus_caixa_forte_v32', JSON.stringify(arquivos));
    localStorage.setItem('maximus_aba', aba);
  }, [arquivos, aba]);

  // 3. LÓGICA DE VALIDAÇÃO CRITICAMENTE REVISADA
  const checarStatus = useCallback((id) => {
    if (!id || arquivos.length === 0) return false;
    return arquivos.some(arq => {
      const nome = arq.nome.replace(/\s/g, '').toUpperCase();
      const idBusca = id.toString().toUpperCase();
      // Regra Especial: CTPP = CIPP
      if (idBusca === 'CIPP' && (nome.includes('CIPP') || nome.includes('CTPP'))) return true;
      return nome.includes(idBusca);
    });
  }, [arquivos]);

  const handleFiles = (e) => {
    const raw = Array.from(e.target.files || e.dataTransfer.files);
    const novos = raw.map(f => ({
      nome: f.name.toUpperCase(),
      hora: new Date().toLocaleTimeString()
    }));
    setArquivos(prev => [...prev, ...novos]);
    alert(`${novos.length} arquivos fixados ao sistema!`);
  };

  const filtrados = useMemo(() => {
    return items.filter(it => {
      const matchTexto = it.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || 
                         it.codigo?.toString().includes(busca);
      const isOk = checarStatus(it.codigo);
      if (filtroStatus === 'VALIDADO') return matchTexto && isOk;
      if (filtroStatus === 'PENDENTE') return matchTexto && !isOk;
      return matchTexto;
    });
  }, [items, busca, filtroStatus, arquivos, checarStatus]);

  if (loading) return <div style={s.loading}><RefreshCcw className="spin"/> AGUARDE... ENGINE MAXIMUS PhD EM CARGA</div>;

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); handleFiles(e);}}>
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00" size={24}/> MAXIMUS <span style={s.badge}>v32</span></div>
        <nav style={s.nav}>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Controle de Frota</button>
        </nav>
        <div style={s.fileBox}>
          <div style={s.fileHead}>EVIDÊNCIAS FIXADAS ({arquivos.length}) <Trash2 size={12} onClick={() => {if(confirm("Limpar base local?")) setArquivos([])}} style={{cursor:'pointer'}}/></div>
          <div style={s.fileScroll}>
            {arquivos.map((a, i) => <div key={i} style={s.fileItem}><CheckCircle size={10} color="#00ff00"/> {a.nome.substring(0,22)}</div>)}
            {arquivos.length === 0 && <div style={{padding:20, color:'#222', fontSize:10, textAlign:'center'}}>Sem arquivos carregados</div>}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.top}>
          <div style={s.searchWrap}><Search size={18} color="#333"/><input style={s.input} placeholder="Buscar por código ou descrição..." value={busca} onChange={e => setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:12}}>
            <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="TODOS">Todos Itens</option>
              <option value="VALIDADO">Conformes</option>
              <option value="PENDENTE">Pendentes</option>
            </select>
            <button style={s.btnRelatorio} onClick={() => window.print()}><Download size={18}/> IMPRIMIR</button>
          </div>
        </header>

        <section style={s.content}>
          {aba === 'DASHBOARD' && (
            <div style={s.dashGrid}>
              <div style={s.cardKpi}><h2>{items.length}</h2><p>Condicionantes Totais</p></div>
              <div style={s.cardKpi}><h2 style={{color:'#00ff00'}}>{items.filter(i => checarStatus(i.codigo)).length}</h2><p>Itens Conformes</p></div>
              <div style={s.cardKpi}><h2 style={{color:'#ff4444'}}>{items.length - items.filter(i => checarStatus(i.codigo)).length}</h2><p>Itens Pendentes</p></div>
            </div>
          )}

          {aba === 'AUDITORIA' && (
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}><Camera color={checarStatus(it.codigo) ? '#00ff00' : '#111'} size={24}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'FROTA' && (
            <div style={{padding:40}}>
              <h2 style={{marginBottom:30, color:'#00ff00'}}>Checklist Automático de Veículos</h2>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.docRow}>
                  <div style={{display:'flex', alignItems:'center', gap:15}}>
                    <div style={{width:10, height:10, borderRadius:'50%', background: checarStatus(doc) ? '#00ff00' : '#ff4444'}}></div>
                    <span>Certificado Obrigatório: <strong>{doc}</strong></span>
                  </div>
                  <span style={{color: checarStatus(doc) ? '#00ff00' : '#ff4444', fontWeight:'bold', fontSize:12}}>
                    {checarStatus(doc) ? 'VALIDADO ✓' : 'NÃO DETECTADO ✗'}
                  </span>
                </div>
              ))}
              <div style={s.alertBox}><AlertTriangle size={14}/> Arraste os arquivos com nomes como "CIPP.pdf" ou "CIV-2026.pdf" para validar.</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#eee', fontFamily: 'Inter, system-ui, sans-serif' },
  side: { width: '280px', background: '#000', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '40px', display: 'flex', gap: '10px', alignItems: 'center' },
  badge: { background: '#00ff00', color: '#000', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontWeight: '600' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#0a0a0a', border: '1px solid #00ff00', color: '#00ff00', borderRadius: '10px', fontWeight: 'bold' },
  fileBox: { flex: 1, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  fileHead: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  fileScroll: { flex: 1, overflowY: 'auto', padding: '15px' },
  fileItem: { fontSize: '10px', color: '#666', marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #080808', paddingBottom: '5px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  top: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', gap: '20px' },
  searchWrap: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 20px', maxWidth: '500px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none', fontSize: '14px' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #111', borderRadius: '12px', padding: '0 15px', fontSize: '12px' },
  btnRelatorio: { background: '#00ff00', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', fontSize: '13px' },
  content: { background: '#080808', border: '1px solid #111', borderRadius: '30px' },
  dashGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', padding: '50px' },
  cardKpi: { background: '#000', padding: '40px', borderRadius: '25px', border: '1px solid #111', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', color: '#333', fontSize: '11px', padding: '20px', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '25px', color: '#00ff00', fontWeight: '900', fontSize: '16px' },
  tdDesc: { fontSize: '14px', color: '#999', padding: '25px', lineHeight: '1.6' },
  docRow: { display: 'flex', justifyContent: 'space-between', padding: '30px', background: '#050505', marginBottom: '15px', borderRadius: '20px', border: '1px solid #111', alignItems: 'center' },
  alertBox: { marginTop: '30px', padding: '15px', background: '#110', border: '1px solid #330', color: '#aa0', borderRadius: '10px', fontSize: '11px', display: 'flex', gap: '10px' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#00ff00', fontWeight: 'bold', fontSize: '16px', gap: '15px' }
};
