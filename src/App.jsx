import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutDashboard, Truck, UploadCloud, 
  Camera, FileText, CheckCircle2, RefreshCcw, Search, Image as ImageIcon
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV20() {
  const [isClient, setIsClient] = useState(false);
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [loading, setLoading] = useState(true);

  // PREVENÇÃO DE ERRO #418: Só inicia após confirmação do Navegador
  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      if (error) console.error("Erro Supabase:", error);
    } catch (e) { console.error("Erro Crítico:", e); }
    finally { setLoading(false); }
  }

  // MOTOR DE ARRASTE PhD (PDF, DOCX, XLSX, JPEG, PNG)
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0) {
      const novos = files.map(f => ({
        nome: f.name,
        tipo: f.type,
        tamanho: (f.size / 1024).toFixed(0) + 'KB'
      }));
      setArquivos(prev => [...prev, ...novos]);
      setAbaAtiva('AUDITORIA');
      alert(`Maximus Engine: ${files.length} documento(s) recebidos com sucesso!`);
    }
  }, []);

  if (!isClient) return null;

  return (
    <div 
      style={s.app} 
      onDragOver={(e) => e.preventDefault()} 
      onDrop={handleDrop}
    >
      {/* SIDEBAR - DESIGN CLARO E PROFISSIONAL */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <ShieldCheck size={28} color="#25d366"/>
          <div>MAXIMUS <span style={s.badge}>PhD v20</span></div>
        </div>
        
        <div style={s.navLabel}>SISTEMA INTEGRADO SEMAS/PA</div>
        <nav style={s.nav}>
          <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.btnA : s.btn}>
            <LayoutDashboard size={20}/> Visão Geral
          </button>
          <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.btnA : s.btn}>
            <FileText size={20}/> Auditoria e Leis
          </button>
          <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.btnA : s.btn}>
            <Truck size={20}/> Frota (CIPP/MOPP)
          </button>
        </nav>

        <div style={s.userCard}>
          <div style={s.avatar}>PS</div>
          <div>
            <div style={{fontSize:13, fontWeight:'bold', color:'#fff'}}>Philipe Santana</div>
            <div style={{fontSize:11, color:'#666'}}>Consultoria PhD</div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Painel de Controle Ambiental</h1>
            <p style={s.subtitle}>Estado do Pará - Engenharia e Licenciamento</p>
          </div>
          
          <div style={s.dropZone}>
            <UploadCloud color="#25d366" size={24}/>
            <div>
              <strong style={{display:'block'}}>Arraste e Cole Aqui</strong>
              <small>PDF, DOCX, XLSX ou FOTOS</small>
            </div>
          </div>
        </header>

        {loading ? <div style={s.loader}>SINCRONIZANDO COM SEMAS...</div> : (
          <div style={s.content}>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}>
                  <CheckCircle2 color="#25d366" size={32}/>
                  <h3>{items.length}</h3>
                  <p>Condicionantes Ativas</p>
                </div>
                <div style={s.card}>
                  <ImageIcon color="#3498db" size={32}/>
                  <h3>{arquivos.length}</h3>
                  <p>Arquivos em Nuvem</p>
                </div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableCard}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>CÓD</th>
                      <th style={s.th}>REQUISITO TÉCNICO / CONDICIONANTE</th>
                      <th style={s.th}>ANEXO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCod}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.descricao_de_condicionante}</td>
                        <td style={s.tdIcon}>
                          <Camera size={22} color={arquivos.length > 0 ? "#25d366" : "#222"}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#0a0a0a', color: '#eee', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: '280px', background: '#000', borderRight: '1px solid #1a1a1a', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '40px' },
  badge: { fontSize: '10px', background: '#25d366', color: '#000', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' },
  navLabel: { fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '15px', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  btn: { display: 'flex', alignItems: 'center', gap: '15px', padding: '14px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', textAlign: 'left', borderRadius: '12px', transition: '0.2s', fontSize: '14px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '15px', padding: '14px', background: '#111', border: '1px solid #222', color: '#25d366', cursor: 'pointer', textAlign: 'left', borderRadius: '12px', fontWeight: 'bold' },
  userCard: { marginTop: 'auto', background: '#0a0a0a', padding: '15px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #111' },
  avatar: { width: '40px', height: '40px', background: '#222', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto', background: 'linear-gradient(135deg, #0a0a0a 0%, #050505 100%)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#fff' },
  subtitle: { margin: '5px 0 0 0', color: '#444', fontSize: '13px' },
  dropZone: { background: 'rgba(37, 211, 102, 0.03)', border: '1px dashed #25d366', padding: '15px 25px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', color: '#25d366', fontSize: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px' },
  card: { background: '#000', border: '1px solid #111', padding: '30px', borderRadius: '24px', textAlign: 'center' },
  tableCard: { background: '#000', borderRadius: '24px', border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px', textAlign: 'left', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #080808', transition: '0.2s' },
  tdCod: { padding: '20px', color: '#25d366', fontWeight: 'bold', width: '50px' },
  tdDesc: { padding: '20px', color: '#999', fontSize: '14px', lineHeight: '1.6' },
  tdIcon: { padding: '20px', textAlign: 'center' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366', fontSize: '12px', letterSpacing: '3px' }
};
