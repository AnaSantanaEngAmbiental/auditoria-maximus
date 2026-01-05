import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, Upload, FileText, Trash2, CheckCircle, Camera, Database, AlertCircle } from 'lucide-react';

// Configuração do Supabase - Conexão estável confirmada pelas imagens
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV29() {
  const [items, setItems] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [render, setRender] = useState(0); 
  const listaDeArquivos = useRef([]); 

  // 1. CARREGAMENTO INICIAL (Banco + Cache)
  useEffect(() => {
    async function init() {
      // Busca as condicionantes do banco (atualmente com 2 linhas conforme imagem)
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      // Recupera arquivos que já estavam na lista lateral
      const salvos = localStorage.getItem('maximus_cache');
      if (salvos) {
        listaDeArquivos.current = JSON.parse(salvos);
        setRender(r => r + 1);
      }
    }
    init();
  }, []);

  // 2. MOTOR DE LEITURA (Arraste ou Clique)
  const processarArquivos = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      tamanho: (f.size / 1024).toFixed(0) + 'KB',
      hora: new Date().toLocaleTimeString()
    }));

    listaDeArquivos.current = [...listaDeArquivos.current, ...novos];
    localStorage.setItem('maximus_cache', JSON.stringify(listaDeArquivos.current));
    
    setRender(r => r + 1);
    alert(`${novos.length} arquivos detectados e listados!`);
  };

  // 3. LÓGICA DE VALIDAÇÃO (Inteligente para CIPP/CTPP)
  const checarDocumento = (prefixo) => {
    const encontrou = listaDeArquivos.current.some(arq => {
      const n = arq.nome;
      if (prefixo === 'CIPP') return n.includes('CIPP') || n.includes('CTPP');
      return n.includes(prefixo);
    });
    return encontrou;
  };

  const limparLista = () => {
    if(confirm("Deseja apagar a lista de arquivos atual?")) {
      listaDeArquivos.current = [];
      localStorage.removeItem('maximus_cache');
      setRender(r => r + 1);
    }
  };

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}>
      
      {/* SIDEBAR - LISTA DE ARQUIVOS (Confirmado em image_57f65f.png) */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00" size={20}/> MAXIMUS <small style={s.v}>PhD v29</small></div>
        
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>
            <FileText size={16}/> Auditoria Técnica
          </button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>
            <Database size={16}/> Controle de Frota
          </button>
        </nav>

        <div style={s.boxArquivos}>
          <div style={s.boxHeader}>
            EVIDÊNCIAS ({listaDeArquivos.current.length})
            <Trash2 size={12} onClick={limparLista} style={{cursor:'pointer'}}/>
          </div>
          <div style={s.scroll}>
            {listaDeArquivos.current.map((a, i) => (
              <div key={i} style={s.fileItem}>
                <CheckCircle size={10} color="#00ff00"/> 
                <span title={a.nome}>{a.nome.substring(0, 22)}...</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.head}>
          <div>
            <h1 style={{margin:0, fontSize:22}}>Painel de Controle Ambiental</h1>
            <p style={{color:'#444', fontSize:12}}>Monitoramento de Condicionantes e Frota</p>
          </div>
          
          <label style={s.dropzone}>
            <Upload size={18}/> <strong>CLIQUE OU SOLTE OS ARQUIVOS</strong>
            <input type="file" multiple hidden onChange={e => processarArquivos(e.target.files)} />
          </label>
        </header>

        <section style={s.content}>
          {aba === 'AUDITORIA' ? (
            <table style={s.table}>
              <thead>
                <tr style={s.th}>
                  <th style={{paddingLeft:20}}>CÓD</th>
                  <th>REQUISITO/CONDICIONANTE</th>
                  <th style={{textAlign:'center'}}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdCod}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td style={{textAlign:'center'}}>
                      <Camera color={listaDeArquivos.current.length > 0 ? '#00ff00' : '#1a1a1a'} size={20}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{padding:40}}>
              <h3 style={{marginBottom:30, color:'#00ff00'}}>Checklist Automático de Frota</h3>
              {['CIPP', 'CIV', 'MOPP', 'ANTT'].map(doc => (
                <div key={doc} style={s.rowDoc}>
                  <div style={{display:'flex', gap:15, alignItems:'center'}}>
                    <div style={{width:8, height:8, borderRadius:'50%', background: checarDocumento(doc) ? '#00ff00' : '#ff4444'}}></div>
                    <span>Certificado / Documentação: <strong>{doc}</strong></span>
                  </div>
                  <span style={{color: checarDocumento(doc) ? '#00ff00' : '#ff4444', fontWeight:'bold'}}>
                    {checarDocumento(doc) ? 'VALIDADO ✓' : 'PENDENTE ✗'}
                  </span>
                </div>
              ))}
              <div style={s.info}>
                <AlertCircle size={14}/> 
                O sistema valida automaticamente arquivos com os nomes acima (Ex: "CIPP_CARRETA.pdf" ou "5.1-CTPP.pdf")
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#050505', color: '#eee', fontFamily: 'sans-serif' },
  side: { width: '260px', background: '#000', borderRight: '1px solid #111', padding: '20px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#00ff00', marginBottom: '35px', display: 'flex', gap: '8px', alignItems: 'center' },
  v: { fontSize: '10px', background: '#003300', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', transition: '0.2s' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0a0a0a', border: '1px solid #00ff00', color: '#00ff00', cursor: 'pointer', borderRadius: '8px' },
  boxArquivos: { flex: 1, background: '#030303', borderRadius: '12px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boxHeader: { padding: '12px', fontSize: '10px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  scroll: { flex: 1, overflowY: 'auto', padding: '10px' },
  fileItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#777', padding: '6px 0', borderBottom: '1px solid #080808' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  dropzone: { border: '1px dashed #00ff00', padding: '15px 25px', borderRadius: '12px', color: '#00ff00', cursor: 'pointer', display: 'flex', gap: '12px', background: 'rgba(0,255,0,0.02)', fontSize: '13px' },
  content: { background: '#080808', border: '1px solid #111', borderRadius: '20px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', background: '#000', color: '#333', fontSize: '11px', height: '50px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdCod: { padding: '20px', color: '#00ff00', fontWeight: 'bold' },
  tdDesc: { fontSize: '13px', color: '#999', lineHeight: '1.5' },
  rowDoc: { display: 'flex', justifyContent: 'space-between', padding: '25px', background: '#050505', marginBottom: '10px', borderRadius: '12px', border: '1px solid #111' },
  info: { marginTop: '20px', fontSize: '11px', color: '#333', display: 'flex', gap: '8px', alignItems: 'center' }
};
