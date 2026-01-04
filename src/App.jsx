import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

// ÍCONES PROTEGIDOS
import { 
  ShieldCheck, FileText, Search, Clock, Printer, Gavel, 
  Download, Scale, RotateCcw, Truck, Layers, UploadCloud, 
  AlertCircle, CheckCircle2, Calendar, FileEdit, 
  Table as TableIcon, Bell, LayoutDashboard, FileDown 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

const App = () => {
  const [isClient, setIsClient] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresas] = useState([
    { id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'Logística TransAmazônica', processo: '2024/00552-SEMAS', cnpj: '11.222.333/0001-44' }
  ]);
  const [empresaAtiva, setEmpresaAtiva] = useState(empresas[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // 1. SEGURANÇA DE CARREGAMENTO (EVITA ERRO VERCEL)
  useEffect(() => {
    setIsClient(true);
    const loadBase = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 1000);
        if (data) setItems(data.map(i => ({...i, descricao: (i['descricao de condicionante'] || '').replace(/["]/g, '')})));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadBase();
  }, []);

  // 2. MOTOR DE EXPORTAÇÃO (PDF, WORD EDITÁVEL, EXCEL)
  const exportarTudo = (formato, item = null, tipo = 'OFICIO') => {
    const nomeDoc = item ? `Item_${item.codigo}` : `PROCURACAO_${empresaAtiva.nome}`;
    const corpoTexto = item ? item.descricao : `Pelo presente instrumento, a empresa ${empresaAtiva.nome} nomeia...`;

    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.text("CARDOSO & RATES - MAXIMUS PhD", 10, 15);
      doc.setFontSize(10);
      doc.text(`Processo: ${empresaAtiva.processo}`, 10, 25);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(corpoTexto, 180), 10, 40);
      doc.save(`${nomeDoc}.pdf`);
    }

    if (formato === 'DOCX') {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: "CARDOSO & RATES ENGENHARIA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Assunto: ${nomeDoc}`, alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: "\n" }),
            new Paragraph({ text: corpoTexto }),
            new Paragraph({ text: "\n\nAssinatura: __________________________" }),
          ]
        }]
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${nomeDoc}.docx`));
    }

    if (formato === 'XLSX') {
      const ws = XLSX.utils.json_to_sheet(items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      XLSX.writeFile(wb, `Planilha_${empresaAtiva.nome}.xlsx`);
    }
  };

  const filtrados = useMemo(() => items.filter(i => i.descricao.toLowerCase().includes(busca.toLowerCase())), [items, busca]);

  if (!isClient || loading) return <div style={styles.loader}><h2>🚀 MAXIMUS v74 PhD: CONSOLIDANDO TUDO...</h2></div>;

  return (
    <div style={styles.app}>
      {/* SIDEBAR COM TODOS OS SERVIÇOS */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366" size={28}/> MAXIMUS PhD</div>
        
        <div style={styles.label}>MENU INTEGRADO</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={{...styles.tabBtn, color: abaAtiva === 'DASHBOARD' ? '#25d366' : '#888'}}><LayoutDashboard size={18}/> Painel Geral</button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={{...styles.tabBtn, color: abaAtiva === 'AUDITORIA' ? '#25d366' : '#888'}}><Layers size={18}/> Auditoria Técnica</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={{...styles.tabBtn, color: abaAtiva === 'FROTA' ? '#25d366' : '#888'}}><Truck size={18}/> Gestão de Frota</button>
        <button onClick={() => setAbaAtiva('CRONOGRAMA')} style={{...styles.tabBtn, color: abaAtiva === 'CRONOGRAMA' ? '#25d366' : '#888'}}><Calendar size={18}/> Cronograma</button>

        <div style={styles.label}>PROCURAÇÕES</div>
        <button onClick={() => exportarTudo('DOCX')} style={styles.actionBtn}><FileEdit size={16}/> Gerar Procuração (Word)</button>

        <div style={styles.label}>CLIENTE SELECIONADO</div>
        <select style={styles.select} onChange={(e) => setEmpresaAtiva(empresas.find(x => x.id === parseInt(e.target.value)))}>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchBox}><Search size={20} color="#444"/><input style={styles.input} placeholder="Pesquisar em todos os serviços..." onChange={(e) => setBusca(e.target.value)} /></div>
          <div style={styles.processBadge}>{empresaAtiva.processo}</div>
        </header>

        {/* ABA: DASHBOARD */}
        {abaAtiva === 'DASHBOARD' && (
          <div style={styles.gridDash}>
            <div style={styles.cardInfo}><h3>417</h3><p>Condicionantes Lidas</p></div>
            <div style={styles.cardInfo}><AlertCircle color="#ff4444"/><h3>03</h3><p>Prazos Críticos</p></div>
            <div style={styles.cardInfo}><CheckCircle2 color="#25d366"/><h3>Excel</h3><p>Relatório Pronto</p></div>
          </div>
        )}

        {/* ABA: AUDITORIA (COM EXPORTAÇÃO TRIPLA) */}
        {abaAtiva === 'AUDITORIA' && (
          <div style={styles.tableArea}>
            <table style={styles.table}>
              <thead><tr><th>CÓD</th><th>EXIGÊNCIA</th><th>EXPORTAR</th><th>STATUS</th></tr></thead>
              <tbody>
                {filtrados.map(item => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.tdCode}>{item.codigo}</td>
                    <td style={styles.tdDesc}>{item.descricao}</td>
                    <td style={styles.tdActions}>
                      <button onClick={() => exportarTudo('PDF', item)} title="PDF" style={styles.iconBtn}><FileText size={14}/></button>
                      <button onClick={() => exportarTudo('DOCX', item)} title="Word Editável" style={styles.iconBtn}><FileEdit size={14}/></button>
                      <button onClick={() => exportarTudo('XLSX', item)} title="Excel" style={styles.iconBtn}><TableIcon size={14}/></button>
                    </td>
                    <td><select style={styles.statusSelect}><option>PENDENTE</option><option>CUMPRIDO</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: FROTA (COM DROPZONE) */}
        {abaAtiva === 'FROTA' && (
          <div style={styles.dropZone}>
            <UploadCloud size={60} color="#25d366" />
            <h2>Upload de Documentos (IA)</h2>
            <p>Arraste arquivos de Frota ou Licenças para processamento automático.</p>
          </div>
        )}

        {/* ABA: CRONOGRAMA */}
        {abaAtiva === 'CRONOGRAMA' && (
          <div style={styles.cardInfo}>
            <Calendar size={40} color="#25d366" />
            <h3>Cronograma de Vencimentos</h3>
            <p>Integrando datas de licenciamento e manutenção de frota...</p>
          </div>
        )}
      </main>
    </div>
  );
};

// --- DESIGN SISTEMA ---
const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#080808', padding: '20px', borderRight: '1px solid #222' },
  logo: { fontSize: '22px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', textAlign: 'left' },
  actionBtn: { width: '100%', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  select: { width: '100%', padding: '10px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  searchBox: { background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  processBadge: { padding: '8px 15px', borderRadius: '20px', background: '#111', border: '1px solid #25d366', color: '#25d366', fontSize: '12px' },
  tableArea: { background: '#080808', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '20px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '20px', fontSize: '13px', color: '#ccc', lineHeight: '1.5' },
  tdActions: { display: 'flex', gap: '8px', padding: '20px' },
  iconBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#25d366', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
  statusSelect: { background: '#111', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px' },
  gridDash: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  cardInfo: { background: '#080808', padding: '40px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' },
  dropZone: { border: '2px dashed #222', borderRadius: '30px', padding: '100px', textAlign: 'center' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#25d366' }
};

export default App;
