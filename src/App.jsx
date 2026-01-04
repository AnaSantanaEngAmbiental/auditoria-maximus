import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// IMPORTAÇÃO COMPLETA - CORRIGE O ERRO "NOT DEFINED"
import { 
  ShieldCheck, FileText, Search, Clock, 
  ChevronRight, AlertTriangle, Printer, 
  Gavel, Users, Download, Scale, RotateCcw, 
  Calendar, Landmark, Briefcase, CheckCircle2
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

const App = () => {
  const [empresas] = useState([
    { id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'Mineração Vale do Pará', processo: '2024/9876-SEMAS', cnpj: '98.765.432/0001-10' }
  ]);
  const [empresaAtiva, setEmpresaAtiva] = useState(empresas[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // BUSCA DE DADOS COM TRATAMENTO DE ERROS
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('base_condicionantes')
        .select('*')
        .range(0, 1000)
        .order('codigo', { ascending: true });

      if (error) throw error;
      
      const cleanData = (data || []).map(i => ({
        ...i,
        descricao: (i['descricao de condicionante'] || '').replace(/["]/g, '')
      }));

      setItems(cleanData);
    } catch (err) {
      console.error("Erro Crítico Maximus:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // FILTRO OTIMIZADO
  const itemsFiltrados = useMemo(() => {
    return items.filter(i => {
      const matchCat = filtro === 'TODOS' || i.categoria === filtro;
      const matchBusca = i.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                         i.codigo?.toString().includes(busca);
      return matchCat && matchBusca;
    });
  }, [items, filtro, busca]);

  const exportDoc = (tipo, dado = {}) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(37, 211, 102);
      doc.setFontSize(16);
      doc.text("CARDOSO & RATES - MAXIMUS v74", 105, 20, { align: "center" });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`CLIENTE: ${empresaAtiva.nome} | PROCESSO: ${empresaAtiva.processo}`, 105, 30, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      if (tipo === 'OFICIO') {
        doc.text(`AO ÓRGÃO AMBIENTAL DO ESTADO DO PARÁ`, 20, 60);
        doc.setFont("helvetica", "bold");
        doc.text(`REF: CONDICIONANTE Nº ${dado.codigo}`, 20, 70);
        doc.setFont("helvetica", "normal");
        const msg = `Vimos apresentar o cumprimento da exigência técnica: \n\n"${dado.descricao}"\n\nProtocolado sob responsabilidade técnica da Cardoso & Rates Engenharia.`;
        doc.text(doc.splitTextToSize(msg, 170), 20, 85);
      } else {
        doc.text("PROCURAÇÃO AD JUDICIA / AMBIENTAL", 105, 60, { align: "center" });
        doc.text(`Pelo presente, a empresa ${empresaAtiva.nome}...`, 20, 80);
      }
      doc.save(`${tipo}_MAXIMUS.pdf`);
    } catch (e) {
      alert("Erro ao gerar PDF. Verifique os dados.");
    }
  };

  if (loading) return <div style={styles.loader}><h2>⚙️ REINICIANDO NÚCLEO...</h2></div>;

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366" size={24}/> MAXIMUS PhD</div>
        
        <div style={styles.label}>EMPRESA</div>
        <select style={styles.select} onChange={(e) => setEmpresaAtiva(empresas.find(x => x.id === parseInt(e.target.value)))}>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>

        <div style={styles.label}>CATEGORIAS</div>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFiltro(cat)} 
            style={{...styles.navBtn, color: filtro === cat ? '#25d366' : '#666', background: filtro === cat ? '#111' : 'transparent'}}
          >
            <ChevronRight size={14}/> {cat}
          </button>
        ))}

        <div style={styles.label}>LEGISLAÇÃO</div>
        <div style={styles.law} onClick={() => window.open('https://www.semas.pa.gov.br/legislacao/')}><Scale size={14}/> SEMAS-PA</div>
        <div style={styles.law} onClick={() => window.open('https://www.belem.pa.gov.br/semma/')}><Landmark size={14}/> SEMMA-Belém</div>

        <button style={styles.mainBtn} onClick={() => exportDoc('PROCURACAO')}><Briefcase size={18}/> Procuração</button>
        <button style={styles.syncBtn} onClick={fetchData}><RotateCcw size={18}/> Sincronizar</button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={20} color="#444"/>
            <input style={styles.searchInput} placeholder="Filtrar base de dados..." onChange={(e) => setBusca(e.target.value)} />
          </div>
          <button style={styles.printBtn} onClick={() => window.print()}><Printer size={18}/> PDF TELA</button>
        </header>

        <div style={styles.banner}>
          <span><strong>Empresa:</strong> {empresaAtiva.nome}</span>
          <span><strong>Processo:</strong> {empresaAtiva.processo}</span>
          <span style={{color: '#25d366'}}><CheckCircle2 size={14}/> Online</span>
        </div>

        <div style={styles.tableArea}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{width: '60px'}}>CÓD</th>
                <th style={{textAlign: 'left'}}>REQUISITO TÉCNICO</th>
                <th style={{width: '80px'}}>OFÍCIO</th>
                <th style={{width: '150px'}}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.tdCode}>{item.codigo}</td>
                  <td style={styles.tdDesc}>{item.descricao}</td>
                  <td style={{textAlign: 'center'}}>
                    <button style={styles.docBtn} onClick={() => exportDoc('OFICIO', item)}><FileText size={16}/></button>
                  </td>
                  <td>
                    <select style={styles.statusSelect}>
                      <option>PENDENTE</option>
                      <option>CONFORME</option>
                      <option>NÃO SE APLICA</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

// ESTILOS FINAIS
const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#080808', padding: '20px', borderRight: '1px solid #222' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' },
  select: { width: '100%', padding: '10px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px' },
  navBtn: { width: '100%', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', textAlign: 'left', borderRadius: '4px' },
  law: { fontSize: '12px', color: '#666', padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  mainBtn: { width: '100%', padding: '12px', backgroundColor: '#25d366', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  syncBtn: { width: '100%', padding: '10px', background: 'none', color: '#555', border: '1px solid #222', borderRadius: '6px', marginTop: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  main: { flex: 1, padding: '25px', overflowY: 'auto' },
  header: { display: 'flex', gap: '20px', marginBottom: '20px' },
  searchContainer: { flex: 1, background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', border: '1px solid #222' },
  searchInput: { background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  printBtn: { background: '#111', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
  banner: { background: '#080808', padding: '15px', borderRadius: '10px', display: 'flex', gap: '30px', fontSize: '12px', marginBottom: '20px', border: '1px solid #222' },
  tableArea: { background: '#080808', borderRadius: '10px', border: '1px solid #222' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '15px', color: '#25d366', fontWeight: 'bold', textAlign: 'center' },
  tdDesc: { padding: '15px', fontSize: '13px', color: '#ccc', lineHeight: '1.5' },
  statusSelect: { background: '#111', color: '#fff', border: '1px solid #333', padding: '5px', borderRadius: '4px' },
  docBtn: { background: 'none', border: '1px solid #333', color: '#25d366', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#25d366' }
};

export default App;
