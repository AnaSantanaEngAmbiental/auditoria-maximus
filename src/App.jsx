import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, UploadCloud, CheckCircle, AlertTriangle, 
  Truck, Shield, Camera, FileCheck, Download
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV21() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');

  // Garante que o sistema só rode no navegador para evitar erros de hidratação
  useEffect(() => {
    fetchBase();
  }, []);

  async function fetchBase() {
    try {
      const { data: res, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (res) setData(res);
      if (error) throw error;
    } catch (e) {
      console.error("Erro de Sincronismo:", e);
    } finally {
      setLoading(false);
    }
  }

  // MOTOR DE ARRASTE PARA MULTI-FORMATOS (PDF, DOCX, XLSX, FOTOS)
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const metadata = droppedFiles.map(f => ({
        nome: f.name,
        tipo: f.type,
        tamanho: (f.size / 1024).toFixed(1) + ' KB'
      }));
      setArquivos(prev => [...prev, ...metadata]);
      alert(`Sistema Maximus: ${droppedFiles.length} arquivo(s) processados com sucesso!`);
    }
  };

  if (loading) return <div style={s.loader}>CARREGANDO ENGENHARIA AMBIENTAL...</div>;

  return (
    <div style={s.app} onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}>
      {/* SIDEBAR PROFISSIONAL */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <Shield color="#2ecc71" size={24}/>
          <span style={{fontWeight:900, fontSize:18}}>MAXIMUS <small style={s.badge}>PhD</small></span>
        </div>

        <nav style={s.nav}>
          <button onClick={() => setAba('AUDITORIA')} style={aba === 'AUDITORIA' ? s.btnActive : s.btn}>
            <FileText size={18}/> Auditoria Técnica
          </button>
          <button onClick={() => setAba('FROTA')} style={aba === 'FROTA' ? s.btnActive : s.btn}>
            <Truck size={18}/> Controle de Frota
          </button>
        </nav>

        <div style={s.perfil}>
          <div style={s.avatar}>PS</div>
          <div>
            <div style={{fontWeight:'bold', color:'#222'}}>Philipe Santana</div>
            <div style={{fontSize:10, color:'#888'}}>Consultoria SEMAS/PA</div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO CLARA */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.h1}>Painel de Licenciamento Integrado</h1>
            <p style={s.p}>Gestão de Condicionantes e Documentação Ambiental</p>
          </div>

          <div style={s.dropArea}>
            <UploadCloud color="#2ecc71" size={28}/>
            <div style={{textAlign:'left'}}>
              <div style={{fontWeight:'bold', fontSize:12, color:'#333'}}>ARRASTE E COLE AQUI</div>
              <div style={{fontSize:10, color:'#999'}}>PDF, DOCX, XLSX ou FOTOS (JPEG)</div>
            </div>
          </div>
        </header>

        <section style={s.content}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h2 style={{fontSize:14, margin:0}}><FileCheck size={16} inline/> Itens de Auditoria na Base</h2>
              <span style={s.countBadge}>{data.length}</span>
            </div>

            <table style={s.table}>
              <thead>
                <tr style={s.thRow}>
                  <th style={s.th}>CÓD</th>
                  <th style={s.th}>REQUISITO / CONDICIONANTE</th>
                  <th style={s.th}>CATEGORIA</th>
                  <th style={s.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.tdBold}>{item.codigo}</td>
                    <td style={s.tdDesc}>{item.descricao_de_condicionante}</td>
                    <td style={s.tdCat}>{item.categoria}</td>
                    <td style={s.tdStatus}>
                      <span style={s.statusPendente}>PENDENTE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* INDICADOR DE ARQUIVOS RECEBIDOS */}
        {arquivos.length > 0 && (
          <div style={s.fileToast}>
            <Camera size={16}/> {arquivos.length} arquivos prontos para análise técnica.
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#f8f9fa', color: '#333', fontFamily: 'Segoe UI, sans-serif' },
  sidebar: { width: '260px', background: '#ffffff', borderRight: '1px solid #e0e0e0', padding: '30px', display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', color: '#1a1a1a' },
  badge: { background: '#2ecc71', color: '#fff', padding: '2px 5px', borderRadius: '4px', fontSize: '10px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', borderRadius: '8px', textAlign: 'left', fontWeight: '500' },
  btnActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', cursor: 'pointer', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  h1: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a1a1a' },
  p: { margin: '5px 0 0 0', fontSize: '13px', color: '#888' },
  dropArea: { background: '#fff', border: '2px dashed #2ecc71', padding: '15px 25px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  cardHeader: { padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  countBadge: { background: '#f0f0f0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#fafafa' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  tdBold: { padding: '18px 20px', fontWeight: 'bold', color: '#2ecc71' },
  tdDesc: { padding: '18px 20px', fontSize: '14px', color: '#444', lineHeight: '1.5' },
  tdCat: { padding: '18px 20px', fontSize: '12px', color: '#888' },
  tdStatus: { padding: '18px 20px' },
  statusPendente: { background: '#fff7ed', color: '#c2410c', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #ffedd5' },
  perfil: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#f9f9f9', borderRadius: '12px' },
  avatar: { width: '36px', height: '36px', background: '#2ecc71', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ecc71', fontWeight: 'bold', letterSpacing: '2px' },
  fileToast: { position: 'fixed', bottom: '20px', right: '20px', background: '#1a1a1a', color: '#fff', padding: '12px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }
};
