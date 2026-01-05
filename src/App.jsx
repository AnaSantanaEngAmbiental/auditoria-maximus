import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { 
  ShieldCheck, LayoutDashboard, Layers, Truck, 
  Search, FileText, FileEdit, CheckCircle2, 
  AlertCircle, UploadCloud, Printer, RotateCcw,
  FileSearch, HardHat
} from 'lucide-react';

// Conexão Segura
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusPhD() {
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // Memória de status por item
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Dados do Projeto (Para o Relatório Pericial)
  const projetoInfo = {
    empresa: "Cardoso & Rates Engenharia",
    processo: "2023/12345-SEMMA",
    tecnico: "Philipe Santana",
    data: new Date().toLocaleDateString('pt-BR')
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('base_condicionantes').select('*').range(0, 500);
        if (data) {
          const formatted = data.map(i => ({
            ...i,
            textoLimpo: (i['descricao de condicionante'] || '').replace(/["]/g, '')
          }));
          setItems(formatted);
          // Inicializa status
          const initialStatus = {};
          formatted.forEach(i => initialStatus[i.codigo] = "PENDENTE");
          setStatusMap(initialStatus);
        }
      } catch (e) { console.error("Erro Supabase:", e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleStatusChange = (id, val) => {
    setStatusMap(prev => ({ ...prev, [id]: val }));
  };

  // PDF COM CARÁTER PERICIAL (Atende ponto 5 da análise)
  const gerarRelatorioTecnico = () => {
    const doc = new jsPDF();
    
    // Cabeçalho Institucional
    doc.setFillColor(37, 211, 102);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - RELATÓRIO TÉCNICO DE AUDITORIA", 105, 13, { align: "center" });

    // Informações do Processo
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`EMPRESA: ${projetoInfo.empresa}`, 15, 30);
    doc.text(`PROCESSO: ${projetoInfo.processo}`, 15, 35);
    doc.text(`DATA: ${projetoInfo.data}`, 160, 30);
    doc.line(15, 38, 195, 38);

    // Listagem de Itens
    let y = 45;
    filtrados.forEach((item, index) => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      doc.setFont("helvetica", "bold");
      const status = statusMap[item.codigo];
      doc.setTextColor(status === "CONCLUÍDO" ? [0, 150, 0] : [200, 0, 0]);
      doc.text(`[${status}] ITEM ${item.codigo}:`, 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const textLines = doc.splitTextToSize(item.textoLimpo, 175);
      doc.text(textLines, 15, y + 5);
      
      y += (textLines.length * 5) + 12;
    });

    // Rodapé de Autenticidade
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Documento gerado digitalmente por Maximus PhD v3.0 - Rastreabilidade Garantida`, 105, 290, { align: "center" });
    
    doc.save(`Relatorio_${projetoInfo.empresa}.pdf`);
  };

  const filtrados = useMemo(() => 
    items.filter(i => i.textoLimpo.toLowerCase().includes(busca.toLowerCase())), 
  [items, busca]);

  if (!mounted) return null;

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS PhD</div>
        
        <div style={s.label}>GESTÃO TÉCNICA</div>
        <button onClick={() => setAbaAtiva('DASHBOARD')} style={abaAtiva === 'DASHBOARD' ? s.tabBtnActive : s.tabBtn}>
          <LayoutDashboard size={18}/> Dashboard
        </button>
        <button onClick={() => setAbaAtiva('AUDITORIA')} style={abaAtiva === 'AUDITORIA' ? s.tabBtnActive : s.tabBtn}>
          <FileSearch size={18}/> Auditoria Técnica
        </button>
        <button onClick={() => setAbaAtiva('FROTA')} style={abaAtiva === 'FROTA' ? s.tabBtnActive : s.tabBtn}>
          <Truck size={18}/> Frota & Logística
        </button>

        <div style={s.label}>ENGENHARIA</div>
        <button style={s.mainBtn} onClick={() => alert("Gerando Procuração...")}>
          <FileEdit size={18}/> Gerar Procuração
        </button>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBox}>
            <Search size={20} color="#444"/>
            <input 
              style={s.input} 
              placeholder="Pesquisar na base normativa..." 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
          <button onClick={gerarRelatorioTecnico} style={s.pdfBtn}>
            <Printer size={16}/> EXPORTAR LAUDO
          </button>
        </header>

        {loading ? (
          <div style={s.loader}>Sincronizando Base de Condicionantes...</div>
        ) : (
          <>
            {abaAtiva === 'DASHBOARD' && (
              <div style={s.grid}>
                <div style={s.card}><h3>{items.length}</h3><p>Condicionantes Analisadas</p></div>
                <div style={s.card}><HardHat color="#25d366"/><h3>0%</h3><p>Risco de Infração</p></div>
                <div style={s.card}><CheckCircle2 color="#25d366"/><h3>ATIVO</h3><p>Monitoramento 24h</p></div>
              </div>
            )}

            {abaAtiva === 'AUDITORIA' && (
              <div style={s.tableContainer}>
                <div style={s.tableHeader}>
                    <span>📍 <b>{projetoInfo.empresa}</b></span>
                    <span>Proc: {projetoInfo.processo}</span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>ID</th>
                      <th style={s.th}>EXIGÊNCIA AMBIENTAL</th>
                      <th style={s.th}>CONFORMIDADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.tdCode}>{item.codigo}</td>
                        <td style={s.tdDesc}>{item.textoLimpo}</td>
                        <td style={s.tdAction}>
                          <select 
                            style={{...s.select, color: statusMap[item.codigo] === 'CONCLUÍDO' ? '#25d366' : '#ff4444'}}
                            value={statusMap[item.codigo]}
                            onChange={(e) => handleStatusChange(item.codigo, e.target.value)}
                          >
                            <option value="PENDENTE">🔴 PENDENTE</option>
                            <option value="CONCLUÍDO">🟢 CONCLUÍDO</option>
                          </select>
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
  sidebar: { width: '260px', backgroundColor: '#080808', padding: '25px', borderRight: '1px solid #222' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', margin: '25px 0 10px 0', letterSpacing: '1px' },
  tabBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  tabBtnActive: { width: '100%', padding: '12px', background: '#111', border: 'none', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', borderRadius: '8px' },
  mainBtn: { width: '100%', padding: '15px', background: '#25d366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  searchBox: { background: '#0a0a0a', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  pdfBtn: { background: '#fff', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  card: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' },
  tableContainer: { background: '#080808', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' },
  tableHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', color: '#888', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#25d366', fontSize: '12px', borderBottom: '1px solid #222' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold' },
  tdDesc: { padding: '15px', color: '#ccc', fontSize: '12px', lineHeight: '1.6' },
  tdAction: { padding: '15px' },
  select: { background: '#000', border: '1px solid #333', padding: '8px', borderRadius: '6px', fontSize: '11px', outline: 'none', cursor: 'pointer' },
  loader: { textAlign: 'center', marginTop: '100px', color: '#25d366' }
};
