import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

  const imprimirTabela = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Auditoria - Maximus PhD", 14, 15);
    const tableData = filtrados.map(i => [i.codigo, i.textoLimpo, "PENDENTE"]);
    doc.autoTable({
      head: [['CÓD', 'REQUISITO TÉCNICO', 'STATUS']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    doc.save("Relatorio_Auditoria.pdf");
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
        
        <div style={s.label}>PAINEL DE CONTROLE</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}>
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}>
          <Layers size={18}/> Auditoria Técnica
        </button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabBtnActive : s.tabBtn}>
          <Truck size={18}/> Frota & Logística
        </button>

        <div style={s.label}>DOCUMENTAÇÃO</div>
        <button onClick={() => exportarDocx("Minuta de Procuração...")} style={s.mainBtn}>
          <FileEdit size={18}/> Gerar Procuração
        </button>
        
        <div style={s.sidebarFooter}>
            <button onClick={() => window.location.reload()} style={s.syncBtn}>
                <RotateCcw size={14}/> Sincronizar Base
            </button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={20} color="#444"/>
            <input 
              style={s.input} 
              placeholder="Filtrar base de dados..." 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <button onClick={imprimirTabela} style={s.pdfBtn}>
            <Printer size={16}/> PDF TELA
          </button>
        </header>

        {loading ? (
          <div style={s.loader}>Carregando dados do servidor...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><h3>{items.length}</h3><p>Condicionantes</p></div>
                <div style={s.card}><AlertCircle color="#ff4444"/><h3>02</h3><p>Prazos Vencendo</p></div>
                <div style={s.card}><CheckCircle2 color="#25d366"/><h3>Online</h3><p>Status da Base</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <div style={s.tableHeader}>
                    <span>Empresa: Cardoso & Rates Engenharia</span>
                    <span>Processo: 2023/12345-SEMMA</span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>CÓD</th>
                      <th style={s.th}>REQUISITO TÉCNICO</th>
                      <th style={s.th}>OFÍCIO</th>
                      <th style={s.th}>STATUS</th>
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
                        <td>
                          <select style={s.select}>
                            <option>PENDENTE</option>
                            <option>CONCLUÍDO</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div style={s.emptyState}>
                <UploadCloud size={60} color="#25d366"/>
                <h2>Módulo de Frota</h2>
                <p>Arraste arquivos aqui para processamento IA</p>
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
  sidebar: { width: '260px', backgroundColor: '#080808', padding: '25px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', margin: '20px 0 10px 0', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', borderRadius: '8px' },
  tabBtnActive: { width: '100%', padding: '12px', background: '#111', border: 'none', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', borderRadius: '8px' },
  mainBtn: { width: '100%', padding: '15px', background: '#25d366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  sidebarFooter: { marginTop: 'auto', paddingTop: '20px' },
  syncBtn: { width: '100%', padding: '10px', background: 'none', border: '1px solid #222', color: '#555', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  searchBox: { background: '#0a0a0a', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#000', border: '1px solid #fff', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#080808', padding: '25px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' },
  tableContainer: { background: '#080808', borderRadius: '15px', border: '1px solid #222' },
  tableHeader: { padding: '15px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #222' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '15px', color: '#ccc', fontSize: '13px', lineHeight: '1.5' },
  tdAction: { padding: '15px' },
  miniBtn: { background: '#111', border: '1px solid #222', color: '#25d366', padding: '6px', borderRadius: '5px', cursor: 'pointer' },
  select: { background: '#000', color: '#fff', border: '1px solid #222', padding: '5px', borderRadius: '5px', fontSize: '11px' },
  loader: { textAlign: 'center', marginTop: '50px', color: '#25d366' },
  emptyState: { textAlign: 'center', padding: '100px', border: '2px dashed #111', borderRadius: '20px', marginTop: '20px' }
};
