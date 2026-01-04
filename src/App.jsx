import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

// IMPORTAÇÃO CORRIGIDA - GARANTINDO QUE 'SEARCH' EXISTA
import { 
  ShieldCheck, FileText, Search, Clock, Printer, Gavel, 
  Download, Scale, RotateCcw, Truck, Layers, UploadCloud, 
  AlertCircle, CheckCircle2, Calendar, FileEdit, 
  Table as TableIcon, Bell, LayoutDashboard
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [empresaAtiva, setEmpresaAtiva] = useState({ id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 1000);
        if (data) setItems(data.map(i => ({
          ...i, 
          descricao: (i['descricao de condicionante'] || '').replace(/["]/g, '')
        })));
      } catch (e) { 
        console.error("Erro Supabase:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, []);

  const handleExport = (formato, item = null) => {
    const titulo = item ? `Item_${item.codigo}` : `PROCURACAO_${empresaAtiva.nome}`;
    const texto = item ? item.descricao : `Pelo presente instrumento, a empresa ${empresaAtiva.nome}...`;

    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.text(doc.splitTextToSize(texto, 180), 10, 20);
      doc.save(`${titulo}.pdf`);
    } else if (formato === 'DOCX') {
      const doc = new Document({
        sections: [{ children: [new Paragraph({ text: texto })] }]
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${titulo}.docx`));
    }
  };

  const filtrados = useMemo(() => 
    items.filter(i => i.descricao.toLowerCase().includes(busca.toLowerCase())), 
  [items, busca]);

  if (!mounted) return null;

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366" size={28}/> MAXIMUS PhD</div>
        
        <div style={styles.label}>MENU</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={styles.tabBtn}><LayoutDashboard size={18}/> Painel</button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={styles.tabBtn}><Layers size={18}/> Auditoria</button>
        <button onClick={() => setAbaAtiva('FROTA')} style={styles.tabBtn}><Truck size={18}/> Frota</button>

        <div style={styles.label}>AÇÕES</div>
        <button onClick={() => handleExport('DOCX')} style={styles.procuracaoBtn}><FileEdit size={16}/> Procuração (Word)</button>
      </aside>

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
          <div style={styles.badge}>{empresaAtiva.nome}</div>
        </header>

        {loading ? (
          <div style={{textAlign: 'center', marginTop: '50px'}}>Carregando base...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={styles.gridDash}>
                <div style={styles.card}><h3>{items.length}</h3><p>Condicionantes</p></div>
                <div style={styles.card}><h3>02</h3><p>Vencimentos</p></div>
                <div style={styles.card}><h3>85%</h3><p>Conformidade</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={styles.tableArea}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>CÓD</th>
                      <th style={styles.th}>REQUISITO</th>
                      <th style={styles.th}>OFÍCIO</th>
                      <th style={styles.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.tdCode}>{item.codigo}</td>
                        <td style={styles.tdDesc}>{item.descricao}</td>
                        <td style={styles.tdActions}>
                          <button onClick={() => handleExport('PDF', item)} style={styles.miniBtn}><FileText size={14}/></button>
                          <button onClick={() => handleExport('DOCX', item)} style={styles.miniBtn}><FileEdit size={14}/></button>
                        </td>
                        <td><select style={styles.statusSelect}><option>PENDENTE</option><option>OK</option></select></td>
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

const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#080808', padding: '20px', borderRight: '1px solid #222' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  procuracaoBtn: { width: '100%', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  searchBox: { background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 15px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  badge: { padding: '8px 15px', borderRadius: '20px', border: '1px solid #25d366', color: '#25d366', fontSize: '12px' },
  tableArea: { background: '#080808', borderRadius: '15px', border: '1px solid #222' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', borderBottom: '1px solid #222', color: '#25d366' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '15px', fontSize: '12px', color: '#ccc', lineHeight: '1.4' },
  tdActions: { display: 'flex', gap: '8px', padding: '15px' },
  miniBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#25d366', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  statusSelect: { background: '#111', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px' },
  gridDash: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' }
};
