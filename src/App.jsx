import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Upload, FileText, Trash2, CheckCircle, Camera, Database, 
  Search, Filter, Download, PieChart, HardHat, Truck, AlertTriangle
} from 'lucide-react';

// Inicialização com tratamento de erro
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MaximusV31() {
  // --- ESTADOS ---
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]); // Mudado para State para garantir reatividade
  const [aba, setAba] = useState('DASHBOARD');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // --- CARREGAMENTO ---
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error("Erro Supabase:", err.message);
      } finally {
        setLoading(false);
      }
      
      const cache = localStorage.getItem('maximus_cache_v31');
      if (cache) setArquivos(JSON.parse(cache));
    }
    loadData();
  }, []);

  // Persistência Automática
  useEffect(() => {
    localStorage.setItem('maximus_cache_v31', JSON.stringify(arquivos));
  }, [arquivos]);

  // --- LÓGICA DE VALIDAÇÃO (CRITICAMENTE REVISADA) ---
  const verificarConformidade = useCallback((id) => {
    return arquivos.some(arq => {
      const nomeLimpo = arq.nome.replace(/\s/g, '').toUpperCase();
      const idStr = id.toString().toUpperCase();
      
      // Regra de Negócio: CTPP vale como CIPP
      if (idStr === 'CIPP' && (nomeLimpo.includes('CIPP') || nomeLimpo.includes('CTPP'))) return true;
      
      // Regra Geral: Contém o código ou nome exato
      return nomeLimpo.includes(idStr);
    });
  }, [arquivos]);

  // --- PROCESSAMENTO DE ARQUIVOS ---
  const onDropFiles = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    const novos = files.map(f => ({
      nome: f.name.toUpperCase(),
      tamanho: (f.size / 1024).toFixed(0) + 'KB',
      data: new Date().toLocaleString()
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  // --- FILTRAGEM (OTIMIZADA) ---
  const filtrados = useMemo(() => {
    return items.filter(it => {
      const cumpreBusca = it.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase()) || 
                          it.codigo?.toString().includes(busca);
      const isConforme = verificarConformidade(it.codigo);
      
      if (filtroStatus === 'VALIDADO') return cumpreBusca && isConforme;
      if (filtroStatus === 'PENDENTE') return cumpreBusca && !isConforme;
      return cumpreBusca;
    });
  }, [items, busca, filtroStatus, arquivos, verificarConformidade]);

  // --- EXPORTAÇÃO ---
  const handleExport = () => {
    const relatorio = filtrados.map(it => 
      `${it.codigo} | ${verificarConformidade(it.codigo) ? 'CONFORME' : 'PENDENTE'} | ${it.descricao_de_condicionante}`
    ).join('\n');
    const blob = new Blob([`RELATÓRIO MAXIMUS PhD\nGerado em: ${new Date().toLocaleString()}\n\n${relatorio}`], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria_ambiental.txt';
    a.click();
  };

  if (loading) return <div style={s.loading}>CARREGANDO ENGINE MAXIMUS...</div>;

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={onDropFiles}>
      
      {/* SIDEBAR */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00" size={24}/> MAXIMUS <span style={s.badge}>PhD v31</span></div>
        
        <nav style={s.nav}>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><PieChart size={18}/> Dashboard</button>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}><HardHat size={18}/> Auditoria</button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}><Truck size={18}/> Frota</button>
        </nav>

        <div style={s.fileBox}>
          <div style={s.fileHeader}>
            <span>EVIDÊNCIAS ({arquivos.length})</span>
            <Trash2 size={14} style={{cursor:'pointer'}} onClick={() => setArquivos([])}/>
          </div>
          <div style={s.fileScroll}>
            {arquivos.map((arq, i) => (
              <div key={i} style={s.fileItem}>
                <CheckCircle size={10} color="#00ff00"/> {arq.nome.substring(0, 22)}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main style={s.main}>
        <header style={s.top}>
          <div style={s.searchContainer}>
            <Search size={18} color="#444"/>
            <input 
              style={s.input} 
              placeholder="Buscar por código ou texto..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          
          <div style={s.actions}>
            <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="TODOS">Todos Itens</option>
              <option value="VALIDADO">Somente Conformidades</option>
              <option value="PENDENTE">Somente Pendências</option>
            </select>
            <button style={s.btnDownload} onClick={handleExport}><Download size={18}/> RELATÓRIO</button>
          </div>
        </header>

        <section style={s.stage}>
          {aba === 'DASHBOARD' && (
            <div style={s.dashGrid}>
              <div style={s.kpi}><h2>{items.length}</h2><p>Condicionantes Totais</p></div>
              <div style={s.kpi}><h2 style={{color:'#00ff00'}}>{items.filter(i => verificarConformidade(i.codigo)).length}</h2><p>Conformes</p></div>
              <div style={s.kpi}><h2 style={{color:'#ff4444'}}>{items.length - items.filter(i => verificarConformidade(i.codigo)).length}</h2><p>Pendentes</p></div>
            </div>
          )}

          {aba === 'AUDITORIA' && (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.th}>
                    <th style={{width:80}}>CÓD</th>
                    <th>REQUISITO LEGAL / CONDICIONANTE</th>
                    <th style={{textAlign:'center', width:100}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((it, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}>
                        <Camera color={verificarConformidade(it.codigo) ? '#00ff00' : '#1a1a1a'} size={22}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'FROTA' && (
            <div style={s.frotaBox}>
              <h3 style={{color:'#00ff00', marginBottom:20}}>Análise de Conformidade de Veículos</h3>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.docRow}>
                  <span>Certificado Obrigatório: <strong>{doc}</strong></span>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    {verificarConformidade(doc) ? <CheckCircle color="#00ff00" size={18}/> : <AlertTriangle color="#ff4444" size={18}/>}
                    <span style={{color: verificarConformidade(doc) ? '#00ff00' : '#ff4444', fontWeight:'bold'}}>
                      {verificarConformidade(doc) ? 'CONFORME' : 'NÃO DETECTADO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// --- ESTILOS PROFISSIONAIS (DRY - Don't Repeat Yourself) ---
const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#eee', fontFamily: 'Inter, sans-serif' },
  side: { width: '280px', background: '#000', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' },
  badge: { fontSize: '10px', background: '#00ff00', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontWeight: '600' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#111', border: '1px solid #00ff00', color: '#00ff00', borderRadius: '10px', fontWeight: 'bold' },
  fileBox: { flex: 1, background: '#030303', borderRadius: '15px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  fileHeader: { padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  fileScroll: { flex: 1, overflowY: 'auto', padding: '15px' },
  fileItem: { fontSize: '11px', color: '#888', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #080808', paddingBottom: '5px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  top: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center', gap: '20px' },
  searchContainer: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  actions: { display: 'flex', gap: '15px' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #111', borderRadius: '10px', padding: '0 15px', fontSize: '12px' },
  btnDownload: { background: '#00ff00', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px' },
  stage: { background: '#080808', borderRadius: '25px', border: '1px solid #111', overflow: 'hidden' },
  dashGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', padding: '40px' },
  kpi: { background: '#000', padding: '40px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', color: '#444', fontSize: '12px', padding: '20px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '20px', color: '#00ff00', fontWeight: 'bold' },
  tdDesc: { fontSize: '13px', color: '#999', lineHeight: '1.6', padding: '20px' },
  frotaBox: { padding: '40px' },
  docRow: { display: 'flex', justifyContent: 'space-between', padding: '25px', background: '#050505', marginBottom: '12px', borderRadius: '15px', border: '1px solid #111' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#00ff00', fontWeight: 'bold', fontSize: '20px' }
};
