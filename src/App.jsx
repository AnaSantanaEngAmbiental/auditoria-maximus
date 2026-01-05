import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, UploadCloud, 
  Camera, FileText, CheckCircle2, RefreshCcw, AlertCircle
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV19() {
  const [isClient, setIsClient] = useState(false);
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [loading, setLoading] = useState(true);

  // Garante estabilidade contra Erro #418
  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
    } catch (e) { console.error("Erro Sync:", e); }
    finally { setLoading(false); }
  }

  // MOTOR DE ARRASTE PARA MULTI-FORMATOS (PDF, DOCX, XLSX, JPEG)
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length > 0) {
      const novosDocs = droppedFiles.map(f => ({
        nome: f.name,
        tipo: f.type,
        tamanho: (f.size / 1024).toFixed(1) + ' KB'
      }));
      setArquivos(prev => [...prev, ...novosDocs]);
      setAbaAtiva('AUDITORIA');
      console.log("Arquivos processados pelo Motor Maximus:", novosDocs);
    }
  }, []);

  if (!isClient) return null;

  return (
    <div 
      style={s.container} 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
      onDrop={handleDrop}
    >
      {/* SIDEBAR TÉCNICA */}
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366"/> MAXIMUS <span style={s.badge}>PhD</span></div>
        
        <nav style={s.nav}>
          <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.btnA : s.btn}>
            <LayoutDashboard size={18}/> Dashboard
          </button>
          <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.btnA : s.btn}>
            <FileText size={18}/> Auditoria Técnica
          </button>
          <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.btnA : s.btn}>
            <Truck size={18}/> Controle de Frota
          </button>
        </nav>

        <div style={s.perfil}>
          <div style={s.avatar}>PS</div>
          <div><div style={{fontSize:12, fontWeight:'bold'}}>Philipe Santana</div><div style={{fontSize:10, color:'#444'}}>Eng. Ambiental PhD</div></div>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={{margin:0, fontSize:22}}>Sistema Integrado SEMAS/PA</h1>
            <p style={{color:'#444', fontSize:12}}>Engenharia Integrada - Estado do Pará</p>
          </div>
          <div style={s.dropZone}>
            <UploadCloud size={20} color="#25d366"/>
            <span>SOLTE PDF, DOCX OU FOTOS AQUI</span>
          </div>
        </header>

        {loading ? <div style={s.loading}>CARREGANDO BASE DE DADOS...</div> : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}>
                  <CheckCircle2 color="#25d366" size={32}/>
                  <h2>{items.length}</h2>
                  <p>Condicionantes na Base</p>
                </div>
                <div style={s.card}>
                  <UploadCloud color="#3498db" size={32}/>
                  <h2>{arquivos.length}</h2>
                  <p>Documentos Digitalizados</p>
                </div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>CÓD</th>
                      <th style={s.th}>REQUISITO DA LICENÇA</th>
                      <th style={s.th}>EVIDÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} style={s.tr}>
                        <td style={s.tdCod}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.descricao_de_condicionante}</td>
                        <td style={s.tdIcon}>
                          <Camera size={20} color={arquivos.length > 0 ? "#25d366" : "#111"}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '260px', background: '#050505', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  badge: { fontSize: '10px', background: '#25d366', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', transition: '0.3s' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #111', paddingBottom: '20px' },
  dropZone: { border: '1px dashed #25d366', padding: '15px 25px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '11px', color: '#25d366', background: 'rgba(37, 211, 102, 0.05)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  card: { background: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '20px', textAlign: 'center' },
  tableContainer: { background: '#050505', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px', textAlign: 'left', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '20px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '20px', color: '#888', fontSize: '13px', lineHeight: '1.6' },
  tdIcon: { padding: '20px', textAlign: 'center' },
  perfil: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#0a0a0a', borderRadius: '12px' },
  avatar: { width: 35, height: 35, background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', fontWeight: 'bold' },
  loading: { textAlign: 'center', marginTop: '100px', color: '#25d366', letterSpacing: '2px' }
};
