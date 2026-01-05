import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// IMPORTAÇÃO COMPLETA DOS ÍCONES (Resolve o erro do seu print)
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  Truck, 
  Layers, 
  UploadCloud, 
  CheckCircle2, 
  Calendar, 
  FileEdit, 
  LayoutDashboard, 
  AlertCircle 
} from 'lucide-react';

// Configuração do Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Garante que o código só rode no navegador (Mata o erro 418)
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 500);
        if (data) {
          setItems(data.map(i => ({
            ...i,
            textoLimpo: (i['descricao de condicionante'] || '').replace(/["]/g, '')
          })));
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Motor de Exportação (PDF e Word Editável)
  const exportar = (formato, txt = "Documento Maximus") => {
    const nomeArquivo = "Maximus_PhD_Export";
    
    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(txt, 180);
      doc.text(splitText, 10, 20);
      doc.save(`${nomeArquivo}.pdf`);
    } else if (formato === 'DOCX') {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [new TextRun({ text: txt, size: 24 })],
            }),
          ],
        }],
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${nomeArquivo}.docx`));
    }
  };

  // 3. Filtro de busca inteligente
  const filtrados = useMemo(() => 
    items.filter(i => i.textoLimpo.toLowerCase().includes(busca.toLowerCase())), 
  [items, busca]);

  // Se não estiver montado, renderiza fundo preto para evitar erro de hidratação
  if (!mounted) return <div style={{backgroundColor: '#000', height: '100vh'}} />;

  return (
    <div style={styles.app}>
      {/* MENU LATERAL (SIDEBAR) */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <ShieldCheck color="#25d366" size={24}/> 
          <span>MAXIMUS PhD</span>
        </div>
        
        <div style={styles.label}>NAVEGAÇÃO</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={styles.tabBtn}>
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={styles.tabBtn}>
          <Layers size={18}/> Auditoria Técnica
        </button>
        <button onClick={() => setAbaAtiva('FROTA')} style={styles.tabBtn}>
          <Truck size={18}/> Frota & Logística
        </button>

        <div style={styles.label}>DOCUMENTOS</div>
        <button onClick={() => exportar('DOCX', "Minuta de Procuração - Cardoso & Rates")} style={styles.mainBtn}>
          <FileEdit size={18}/> Gerar Procuração
        </button>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={20} color="#444"/>
            <input 
              style={styles.input} 
              placeholder="Pesquisar condicionantes..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <div style={styles.badge}>Cardoso & Rates Engenharia</div>
        </header>

        {loading ? (
          <div style={styles.loader}>Conectando ao banco de dados...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={styles.grid}>
                <div style={styles.card}>
                  <LayoutDashboard color="#25d366" size={30}/>
                  <h3>{items.length}</h3>
                  <p>Itens na Base</p>
                </div>
                <div style={styles.card}>
                  <AlertCircle color="#ff4444" size={30}/>
                  <h3>03</h3>
                  <p>Pendências Críticas</p>
                </div>
                <div style={styles.card}>
                  <CheckCircle2 color="#25d366" size={30}/>
                  <h3>100%</h3>
                  <p>Sincronizado</p>
                </div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={styles.container}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>CÓD</th>
                      <th style={styles.th}>REQUISITO TÉCNICO</th>
                      <th style={styles.th}>EXPORTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.tdCode}>{item.codigo}</td>
                        <td style={styles.tdDesc}>{item.textoLimpo}</td>
                        <td style={styles.tdAction}>
                          <button title="PDF" onClick={() => exportar('PDF', item.textoLimpo)} style={styles.miniBtn}>
                            <FileText size={14}/>
                          </button>
                          <button title="Word" onClick={() => exportar('DOCX', item.textoLimpo)} style={styles.miniBtn}>
                            <FileEdit size={14}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={styles.dropzone}>
                <UploadCloud size={60} color="#25d366" style={{marginBottom: '20px'}}/>
                <h2>Módulo de Frota & Logística</h2>
                <p>Arraste arquivos de CRLV ou Licenças para análise automática</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ESTILIZAÇÃO CONSOLIDADA
const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#080808', padding: '25px', borderRight: '1px solid #222' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  label: { fontSize: '11px', color: '#444', fontWeight: 'bold', margin: '25px 0 10px 0', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px 0', background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: '0.3s' },
  mainBtn: { width: '100%', padding: '15px', background: '#25d366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#000' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' },
  searchBox: { background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  badge: { padding: '10px 20px', borderRadius: '25px', border: '1px solid #25d366', color: '#25d366', fontSize: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  card: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  container: { background: '#080808', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', color: '#25d366', borderBottom: '1px solid #222', fontSize: '12px' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '20px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '20px', color: '#ccc', fontSize: '13px', lineHeight: '1.6' },
  tdAction: { padding: '20px', display: 'flex', gap: '10px' },
  miniBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#25d366', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  dropzone: { border: '2px dashed #222', borderRadius: '25px', padding: '100px', textAlign: 'center', marginTop: '20px', color: '#444' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366', fontWeight: 'bold' }
};
