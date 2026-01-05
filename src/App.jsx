import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { 
  ShieldCheck, LayoutDashboard, Layers, Truck, 
  Search, FileText, FileEdit, CheckCircle2, 
  AlertCircle, UploadCloud, Printer, RotateCcw
} from 'lucide-react';

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

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 500);
        if (data) setItems(data.map(i => ({
          ...i,
          textoLimpo: (i['descricao de condicionante'] || '').replace(/["]/g, '')
        })));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Versão simplificada da impressão para evitar erro no Vercel
  const imprimirSimples = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório Maximus PhD", 10, 10);
    doc.setFontSize(10);
    let y = 20;
    filtrados.slice(0, 20).forEach(item => {
      doc.text(`${item.codigo} - ${item.textoLimpo.substring(0, 80)}...`, 10, y);
      y += 10;
    });
    doc.save("Relatorio.pdf");
  };

  const exportarDocx = (txt) => {
    const doc = new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun(txt)] })] }]
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, "Documento_Editavel.docx"));
  };

  const filtrados = useMemo(() => 
    items.filter(i => i.textoLimpo.toLowerCase().includes(busca.toLowerCase())), 
  [items, busca]);

  if (!mounted) return null;

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS PhD</div>
        
        <div style={s.label}>PAINEL</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}>
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}>
          <Layers size={18}/> Auditoria Técnica
        </button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabBtnActive : s.tabBtn}>
          <Truck size={18}/> Frota & Logística
        </button>

        <div style={s.label}>AÇÕES快速</div>
        <button onClick={() => exportarDocx("Minuta de Procuração...")} style={s.mainBtn}>
          <FileEdit size={18}/> Gerar Procuração
        </button>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={20} color="#444"/>
            <input 
              style={s.input} 
              placeholder="Pesquisar..." 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <button onClick={imprimirSimples} style={s.pdfBtn}>
            <Printer size={16}/> PDF TELA
          </button>
        </header>

        {loading ? (
          <div style={s.loader}>Carregando...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><h3>{items.length}</h3><p>Itens</p></div>
                <div style={s.card}><AlertCircle color="#ff4444"/><h3>02</h3><p>Alertas</p></div>
                <div style={s.card}><CheckCircle2 color="#25d366"/><h3>Ativo</h3><p>Servidor</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>CÓD</th>
                      <th style={s.th}>REQUISITO</th>
                      <th style={s.th}>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.textoLimpo}</td>
                        <td style={s.tdAction}>
                          <button onClick={() => exportarDocx(item.textoLimpo)} style={s.miniBtn}><FileText size={14}/></button>
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
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '250px', backgroundColor: '#080808', padding: '20px', borderRight: '1px solid #222' },
  logo: { color: '#25d366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '10px', color: '#444', margin: '20px 0 10px 0' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '10px' },
  tabBtnActive: { width: '100%', padding: '12px', background: '#111', border: 'none', color: '#25d366', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '10px', borderRadius: '8px' },
  mainBtn: { width: '100%', padding: '15px', background: '#25d366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  searchBox: { background: '#111', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#000', border: '1px solid #fff', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#080808', padding: '25px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' },
  tableContainer: { background: '#080808', borderRadius: '15px', border: '1px solid #222' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#25d366', borderBottom: '1px solid #222' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '15px', color: '#ccc', fontSize: '12px' },
  tdAction: { padding: '15px' },
  miniBtn: { background: '#111', border: '1px solid #222', color: '#25d366', padding: '6px', borderRadius: '5px' },
  loader: { textAlign: 'center', marginTop: '50px', color: '#25d366' }
};
