import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

import { 
  ShieldCheck, FileText, Search, Clock, ChevronRight, Printer, 
  Gavel, Download, Scale, RotateCcw, Truck, Layers, 
  UploadCloud, AlertCircle, CheckCircle2, Calendar, 
  FileEdit, Table as TableIcon, Bell, LayoutDashboard, FileDown
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

const App = () => {
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresas] = useState([
    { id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA', cnpj: '12.345.678/0001-90', endereco: 'Belém, PA' },
    { id: 2, nome: 'Mineração Vale do Pará', processo: '2024/9876-SEMAS', cnpj: '98.765.432/0001-10', endereco: 'Parauapebas, PA' }
  ]);
  const [empresaAtiva, setEmpresaAtiva] = useState(empresas[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState('TODOS');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').range(0, 1000);
      setItems(data.map(i => ({...i, descricao: (i['descricao de condicionante'] || '').replace(/["]/g, '')})));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ENGINE DE EXPORTAÇÃO MULTI-FORMATO ---

  const exportDocument = (formato, tipoDoc, dado = {}) => {
    const titulo = tipoDoc === 'OFICIO' ? `Ofício de Cumprimento - Item ${dado.codigo}` : `Procuração Ambiental - ${empresaAtiva.nome}`;
    const conteudo = tipoDoc === 'OFICIO' 
      ? `Referente à condicionante: ${dado.descricao}. Solicitamos a análise e baixa técnica.`
      : `Pelo presente instrumento, a empresa ${empresaAtiva.nome}, inscrita no CNPJ ${empresaAtiva.cnpj}, nomeia Cardoso & Rates...`;

    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.text("CARDOSO & RATES ENGENHARIA", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(titulo, 10, 40);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(conteudo, 180), 10, 50);
      doc.save(`${titulo}.pdf`);
    }

    if (formato === 'DOCX') {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: "CARDOSO & RATES ENGENHARIA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "\n" }),
            new Paragraph({ children: [new TextRun({ text: titulo, bold: true, size: 24 })] }),
            new Paragraph({ text: "\n" }),
            new Paragraph({ text: conteudo }),
            new Paragraph({ text: "\n\nBelém-PA, " + new Date().toLocaleDateString() }),
          ],
        }],
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${titulo}.docx`));
    }

    if (formato === 'XLSX') {
      const ws = XLSX.utils.json_to_sheet([dado.codigo ? dado : { Empresa: empresaAtiva.nome, Documento: titulo }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Export");
      XLSX.writeFile(wb, `${titulo}.xlsx`);
    }
  };

  const itemsFiltrados = useMemo(() => {
    return items.filter(i => (filtroCat === 'TODOS' || i.categoria === filtroCat) && i.descricao.toLowerCase().includes(busca.toLowerCase()));
  }, [items, filtroCat, busca]);

  if (loading) return <div style={styles.loader}><h2>🚀 MAXIMUS v74: CONSOLIDANDO SISTEMA...</h2></div>;

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366" size={28}/> MAXIMUS PhD</div>
        
        <div style={styles.label}>MENU DE SERVIÇOS</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={{...styles.tabBtn, color: abaAtiva === 'DASHBOARD' ? '#25d366' : '#888'}}><LayoutDashboard size={18}/> Dashboard</button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={{...styles.tabBtn, color: abaAtiva === 'AUDITORIA' ? '#25d366' : '#888'}}><Layers size={18}/> Auditoria Técnica</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={{...styles.tabBtn, color: abaAtiva === 'FROTA' ? '#25d366' : '#888'}}><Truck size={18}/> Gestão de Frota</button>
        <button onClick={() => setAbaAtiva('CRONOGRAMA')} style={{...styles.tabBtn, color: abaAtiva === 'CRONOGRAMA' ? '#25d366' : '#888'}}><Calendar size={18}/> Cronograma</button>

        <div style={styles.label}>AÇÕES RÁPIDAS</div>
        <button onClick={() => exportDocument('DOCX', 'PROCURACAO')} style={styles.actionBtn}><FileEdit size={16}/> Gerar Procuração (Word)</button>
        
        <div style={styles.label}>CLIENTE ATIVO</div>
        <select style={styles.select} onChange={(e) => setEmpresaAtiva(empresas.find(x => x.id === parseInt(e.target.value)))}>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={20} color="#444"/>
            <input style={styles.input} placeholder="Pesquisar em tudo..." onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div style={styles.badge}>{empresaAtiva.nome}</div>
        </header>

        {abaAtiva === 'AUDITORIA' && (
          <div style={styles.tableArea}>
            <div style={styles.filterRow}>
              {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(c => (
                <button key={c} onClick={() => setFiltroCat(c)} style={{...styles.miniTab, background: filtroCat === c ? '#25d366' : '#111', color: filtroCat === c ? '#000' : '#fff'}}>{c}</button>
              ))}
            </div>
            <table style={styles.table}>
              <thead><tr><th>CÓD</th><th>EXIGÊNCIA</th><th style={{width: '180px'}}>EXPORTAR COMO</th><th>STATUS</th></tr></thead>
              <tbody>
                {itemsFiltrados.map(item => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.tdCode}>{item.codigo}</td>
                    <td style={styles.tdDesc}>{item.descricao}</td>
                    <td style={styles.tdActions}>
                      <button onClick={() => exportDocument('PDF', 'OFICIO', item)} style={styles.iconBtn}><FileText size={14}/></button>
                      <button onClick={() => exportDocument('DOCX', 'OFICIO', item)} style={styles.iconBtn}><FileEdit size={14}/></button>
                      <button onClick={() => exportDocument('XLSX', 'OFICIO', item)} style={styles.iconBtn}><TableIcon size={14}/></button>
                    </td>
                    <td><select style={styles.statusSelect}><option>PENDENTE</option><option>OK</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div style={styles.dropZone}>
            <UploadCloud size={60} color="#25d366" />
            <h2>IA de Frota: Arraste os Documentos</h2>
            <p>PDFs de CRLV, CNH e Licenças Ambientais de Veículos</p>
            <input type="file" style={styles.fileInput} />
          </div>
        )}

        {abaAtiva === 'CRONOGRAMA' && (
          <div style={styles.cardInfo}>
            <Calendar size={40} color="#25d366" />
            <h3>Cronograma de Vencimentos</h3>
            <p>Os alertas serão gerados automaticamente com base na leitura dos documentos e condicionantes.</p>
          </div>
        )}

        {abaAtiva === 'DASHBOARD' && (
          <div style={styles.gridDash}>
            <div style={styles.cardInfo}><h3>417</h3><p>Itens na Base</p></div>
            <div style={styles.cardInfo}><h3>02</h3><p>Licenças Vencendo</p></div>
            <div style={styles.cardInfo}><h3>100%</h3><p>Segurança de Dados</p></div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#080808', padding: '25px', borderRight: '1px solid #222' },
  logo: { fontSize: '22px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '25px', marginBottom: '10px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', marginBottom: '5px' },
  actionBtn: { width: '100%', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  select: { width: '100%', padding: '12px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  searchBox: { background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 20px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '18px', width: '100%', outline: 'none' },
  badge: { padding: '8px 15px', borderRadius: '20px', border: '1px solid #25d366', color: '#25d366', fontSize: '12px' },
  tableArea: { background: '#080808', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' },
  filterRow: { padding: '15px', display: 'flex', gap: '10px', background: '#111' },
  miniTab: { padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '20px', color: '#25d366', fontWeight: 'bold', textAlign: 'center' },
  tdDesc: { padding: '20px', fontSize: '13px', color: '#ccc', lineHeight: '1.6' },
  tdActions: { display: 'flex', gap: '8px', padding: '20px' },
  iconBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#25d366', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  statusSelect: { background: '#111', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px' },
  dropZone: { border: '2px dashed #222', borderRadius: '30px', padding: '100px', textAlign: 'center' },
  fileInput: { position: 'absolute', opacity: 0, cursor: 'pointer' },
  gridDash: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  cardInfo: { background: '#080808', padding: '40px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#25d366' }
};

export default App;
