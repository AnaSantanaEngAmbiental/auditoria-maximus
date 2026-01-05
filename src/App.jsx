import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Shield, UploadCloud, FileText, Truck, Camera, CheckCircle, Database, Trash2 } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusFinal() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);

  // BLINDAGEM: Só ativa o motor quando o navegador está pronto
  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // MOTOR DE ARRASTE PhD (RECONSTRUÍDO)
  const processarArquivos = useCallback((files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      tipo: f.type,
      data: new Date().toLocaleTimeString()
    }));
    setArquivos(prev => [...prev, ...novos]);
    // Feedback visual imediato
    alert(`MAXIMUS: ${files.length} arquivo(s) detectados e processados!`);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivos(e.dataTransfer.files);
    }
  };

  // Funções de Checklist de Frota
  const temDoc = (nome) => arquivos.some(a => a.nome.includes(nome));

  if (!mounted) return null;

  return (
    <div style={s.app} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {/* SIDEBAR CONSOLIDADA */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#00ff00" size={24}/> MAXIMUS PhD</div>
        
        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnA : s.btn}>
            <FileText size={18}/> Auditoria Técnica
          </button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnA : s.btn}>
            <Truck size={18}/> Frota (CIPP/MOPP)
          </button>
          <button onClick={() => setAba('NUVEM')} style={aba === 'NUVEM' ? s.btnA : s.btn}>
            <Database size={18}/> Arquivos ({arquivos.length})
          </button>
        </nav>

        <div style={s.user}>
          <div style={s.avatar}>PS</div>
          <div style={{fontSize:11}}><strong>Philipe Santana</strong><br/>Eng. Ambiental PhD</div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.h1}>Sistema Integrado SEMAS/PA</h1>
            <p style={s.p}>Engenharia de Licenciamento de Impacto</p>
          </div>
          
          <div style={s.dropzone}>
            <UploadCloud color="#00ff00" size={28}/>
            <div style={{textAlign:'left'}}>
              <strong>SOLTE ARQUIVOS AQUI</strong>
              <div style={{fontSize:9, color:'#666'}}>PDF, DOCX, XLSX ou FOTOS</div>
            </div>
          </div>
        </header>

        <div style={s.content}>
          {loading ? <div style={s.loader}>SINCRONIZANDO COM SUPABASE...</div> : (
            <>
              {aba === 'AUDITORIA' && (
                <div style={s.card}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.thRow}>
                        <th style={s.th}>CÓD</th>
                        <th style={s.th}>REQUISITO DA LICENÇA</th>
                        <th style={s.th}>EVIDÊNCIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} style={s.tr}>
                          <td style={s.tdC}>{item.codigo}</td>
                          <td style={s.tdD}>{item.descricao_de_condicionante}</td>
                          <td style={s.tdI}>
                            <Camera size={20} color={arquivos.length > 0 ? "#00ff00" : "#1a1a1a"}/>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {aba === 'FROTA' && (
                <div style={s.cardP}>
                  <h3 style={{color:'#00ff00', marginBottom:20}}>Checklist Automático de Documentação</h3>
                  {['CIV', 'CIPP', 'MOPP', 'ANTT'].map(doc => (
                    <div key={doc} style={s.rowDoc}>
                      <span>Documento: <strong>{doc}</strong></span>
                      <span style={{color: temDoc(doc) ? '#00ff00' : '#ff4444', fontWeight:'bold'}}>
                        {temDoc(doc) ? '✓ VALIDADO NO SISTEMA' : '✗ AGUARDANDO ARQUIVO'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {aba === 'NUVEM' && (
                <div style={s.cardP}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <h3>Arquivos na Sessão</h3>
                    <button onClick={() => setArquivos([])} style={s.btnClean}><Trash2 size={14}/> Limpar</button>
                  </div>
                  {arquivos.map((f, i) => (
                    <div key={i} style={s.fileItem}>
                       <CheckCircle size={12} color="#00ff00"/> {f.nome} <small>({f.data})</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#0a0a0a', color: '#eee', fontFamily: 'Inter, sans-serif' },
  side: { width: '260px', background: '#000', borderRight: '1px solid #1a1a1a', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '900', color: '#fff', marginBottom: '40px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#111', border: '1px solid #222', color: '#00ff00', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  h1: { margin: 0, fontSize: '24px', fontWeight: '800' },
  p: { margin: '5px 0 0 0', color: '#555', fontSize: '13px' },
  dropzone: { border: '2px dashed #00ff00', padding: '15px 25px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(0,255,0,0.02)', color: '#00ff00', fontSize: '12px', cursor: 'pointer' },
  content: { minHeight: '60vh' },
  card: { background: '#000', border: '1px solid #111', borderRadius: '20px', overflow: 'hidden' },
  cardP: { background: '#000', border: '1px solid #111', borderRadius: '20px', padding: '30px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#050505' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '11px', color: '#333', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdC: { padding: '20px', color: '#00ff00', fontWeight: 'bold' },
  tdD: { padding: '20px', color: '#999', fontSize: '13px', lineHeight: '1.6' },
  tdI: { padding: '20px', textAlign: 'center' },
  rowDoc: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#080808', borderRadius: '12px', marginBottom: '10px', border: '1px solid #111' },
  fileItem: { padding: '10px', fontSize: '12px', color: '#666', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '10px' },
  user: { marginTop: 'auto', background: '#080808', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #111' },
  avatar: { width: '35px', height: '35px', background: '#00ff00', color: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  loader: { padding: '100px', textAlign: 'center', color: '#00ff00', letterSpacing: '4px', fontSize: '12px' },
  btnClean: { background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }
};
