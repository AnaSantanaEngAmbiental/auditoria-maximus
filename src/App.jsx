import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ShieldCheck, FileText, Search, Clock, 
  ChevronRight, AlertTriangle, Printer, 
  Gavel, Users, Download, Scale, Trash2, Calendar
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

const App = () => {
  // 1. ESTADOS COM CONTROLE DE MEMÓRIA
  const [empresas] = useState([
    { id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'Mineração Vale do Pará', processo: '2024/9876-SEMAS', cnpj: '98.765.432/0001-10' }
  ]);
  const [empresaAtiva, setEmpresaAtiva] = useState(empresas[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // 2. CARREGAMENTO SEGURO (TRATAMENTO DE ERROS)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('base_condicionantes')
        .select('*')
        .range(0, 999) // Garante que lê todos os 417+ itens
        .order('codigo', { ascending: true });

      if (error) throw error;
      
      // Sanitização: Remove caracteres que quebram o layout
      const cleanData = data.map(i => ({
        ...i,
        descricao: (i['descricao de condicionante'] || '').replace(/"/g, '')
      }));

      setItems(cleanData);
    } catch (err) {
      console.error("Erro na Base Maximus:", err);
      alert("Falha na conexão com a base de dados do Pará.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 3. FILTRAGEM OTIMIZADA (EVITA TRAVAMENTOS)
  const itemsFiltrados = useMemo(() => {
    return items.filter(i => {
      const matchCat = filtro === 'TODOS' || i.categoria === filtro;
      const matchBusca = i.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                         i.codigo?.toString().includes(busca);
      return matchCat && matchBusca;
    });
  }, [items, filtro, busca]);

  // 4. GERADOR DE OFÍCIOS (LAYOUT PhD)
  const exportDoc = (tipo, dado = {}) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.rect(10, 10, 190, 280); // Borda de segurança
    
    doc.setFontSize(14);
    doc.text("CARDOSO & RATES - ENGENHARIA AMBIENTAL", 105, 25, { align: "center" });
    doc.setFontSize(10);
    doc.text(`AUDITORIA: ${empresaAtiva.nome} | PROCESSO: ${empresaAtiva.processo}`, 105, 32, { align: "center" });
    doc.line(20, 35, 190, 35);

    if (tipo === 'OFICIO') {
      doc.text(`REF: CONDICIONANTE Nº ${dado.codigo}`, 20, 50);
      doc.setFont("helvetica", "normal");
      const corpo = `Ao Órgão Ambiental,\n\nApresentamos o cumprimento da exigência técnica para o licenciamento ambiental do empreendimento conforme segue:\n\nExigência: ${dado.descricao}\n\nProtocolamos os anexos para análise e baixa da pendência.`;
      doc.text(doc.splitTextToSize(corpo, 170), 20, 65);
    } else {
      doc.text("PROCURAÇÃO PARA FINS AMBIENTAIS", 105, 50, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(`Pelo presente, a ${empresaAtiva.nome}, CNPJ ${empresaAtiva.cnpj}, nomeia...`, 20, 70);
    }

    doc.text(`Belém-PA, ${new Date().toLocaleDateString()}`, 20, 150);
    doc.save(`${tipo}_${empresaAtiva.nome}.pdf`);
  };

  if (loading) return <div style={styles.loader}><h2>⚙️ MAXIMUS v74: REESTRUTURANDO DADOS...</h2></div>;

  return (
    <div style={styles.app}>
      {/* LATERAL DE CONTROLE */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366"/> MAXIMUS v74</div>
        
        <div style={styles.label}>SELECIONAR CLIENTE</div>
        <select style={styles.select} onChange={(e) => setEmpresaAtiva(empresas.find(x => x.id === parseInt(e.target.value)))}>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>

        <div style={styles.label}>FILTRAR CATEGORIA</div>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} style={{...styles.navBtn, borderLeft: filtro === cat ? '3px solid #25d366' : 'none', color: filtro === cat ? '#25d366' : '#888'}}>
            <ChevronRight size={14}/> {cat}
          </button>
        ))}

        <div style={styles.label}>BASE LEGAL PA</div>
        <div style={styles.law} onClick={() => window.open('https://www.semas.pa.gov.br/legislacao/')}><Scale size={14}/> SEMAS Estadual</div>
        <div style={styles.law} onClick={() => window.open('https://www.belem.pa.gov.br/semma/')}><Gavel size={14}/> SEMMA Belém</div>

        <button style={styles.mainBtn} onClick={() => exportDoc('PROCURACAO')}><FileText size={18}/> Nova Procuração</button>
        <button style={styles.resetBtn} onClick={() => fetchData()}><RotateCcw size={18}/> Sincronizar Tudo</button>
      </aside>

      {/* PAINEL DE OPERAÇÕES */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.search}>
            <Search size={20} color="#555"/>
            <input placeholder="Busca inteligente em 417 condicionantes..." onChange={(e) => setBusca(e.target.value)} style={styles.input}/>
          </div>
          <div style={styles.statusBadge}>Processo: {empresaAtiva.processo}</div>
        </header>

        <section style={styles.stats}>
          <div style={styles.card}><h4>{itemsFiltrados.length}</h4><span>Itens Ativos</span></div>
          <div style={styles.card}><h4>PA</h4><span>Legislação</span></div>
          <div style={styles.card}><button onClick={() => window.print()} style={styles.printBtn}><Printer size={16}/> Relatório</button></div>
        </section>

        <div style={styles.tableArea}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{width: '60px'}}>CÓD</th>
                <th style={{textAlign: 'left'}}>DESCRIÇÃO TÉCNICA DO LICENCIAMENTO</th>
                <th style={{width: '120px'}}>OFÍCIO</th>
                <th style={{width: '150px'}}>CONFORMIDADE</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.tdCode}>{item.codigo}</td>
                  <td style={styles.tdDesc}>{item.descricao}</td>
                  <td style={{textAlign:'center'}}>
                    <button style={styles.docBtn} onClick={() => exportDoc('OFICIO', item)}><FileText size={16}/></button>
                  </td>
                  <td>
                    <select style={styles.statusSelect}>
                      <option>PENDENTE</option>
                      <option>CONFORME</option>
                      <option>NÃO APLICÁVEL</option>
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

const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#080808', padding: '25px', borderRight: '1px solid #222' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  label: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '30px', marginBottom: '10px', letterSpacing: '1px' },
  select: { width: '100%', padding: '12px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px' },
  navBtn: { width: '100%', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', textAlign: 'left' },
  law: { fontSize: '12px', color: '#666', padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  mainBtn: { width: '100%', padding: '15px', backgroundColor: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  resetBtn: { width: '100%', padding: '10px', background: 'none', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '8px', marginTop: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  search: { backgroundColor: '#111', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 20px', width: '60%', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', padding: '15px', width: '100%', outline: 'none' },
  statusBadge: { backgroundColor: '#111', padding: '10px 20px', borderRadius: '30px', border: '1px solid #25d366', fontSize: '12px', color: '#25d366' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: '#080808', padding: '20px', borderRadius: '12px', border: '1px solid #222', textAlign: 'center' },
  printBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  tableArea: { backgroundColor: '#080808', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #111' },
  tdCode: { padding: '20px', color: '#25d366', fontWeight: 'bold', textAlign: 'center' },
  tdDesc: { padding: '20px', fontSize: '13px', color: '#ccc', lineHeight: '1.6', width: '60%' },
  statusSelect: { backgroundColor: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '6px', fontSize: '11px' },
  docBtn: { background: '#111', border: '1px solid #333', color: '#25d366', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#25d366' }
};

export default App;
