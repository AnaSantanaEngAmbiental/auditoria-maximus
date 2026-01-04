import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ShieldCheck, FileText, Scale, Clock, 
  CheckCircle2, AlertTriangle, hardDrive, 
  Printer, Gavel, Users, Download, 
  Calendar, MessageSquare, Trash2
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

const App = () => {
  // 1. GESTÃO DE ESTADOS PhD
  const [empresas, setEmpresas] = useState([
    { id: 1, nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'Mineração Vale do Pará', processo: '2024/9876-SEMAS', cnpj: '98.765.432/0001-10' }
  ]);
  const [empresaAtiva, setEmpresaAtiva] = useState(empresas[0]);
  const [condicionantes, setCondicionantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // 2. BASE DE LEIS (PARÁ & MUNICÍPIOS)
  const baseLeis = [
    { id: 1, norma: 'Lei Estadual 5.887/95', ref: 'Política Estadual de Meio Ambiente (PA)' },
    { id: 2, norma: 'Resolução COEMA 162/2021', ref: 'Licenciamento Ambiental no Pará' },
    { id: 3, norma: 'Lei Municipal 1.452/2020', ref: 'Código Ambiental de Belém' },
    { id: 4, norma: 'Instrução Normativa SEMAS nº 02/2021', ref: 'Prazos de Condicionantes' }
  ];

  useEffect(() => { fetchDados(); }, [empresaAtiva]);

  async function fetchDados() {
    setLoading(true);
    const { data } = await supabase.from('base_condicionantes').select('*').range(0, 1000).order('codigo', { ascending: true });
    if (data) setCondicionantes(data);
    setLoading(false);
  }

  // 3. GERADOR DE DOCUMENTOS COM TIMBRADO
  const gerarDocumento = (tipo, item = {}) => {
    const doc = new jsPDF();
    doc.setFillColor(0, 50, 40); // Dark Green
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("CARDOSO & RATES - CONSULTORIA AMBIENTAL", 105, 15, { align: "center" });
    doc.setFontSize(8);
    doc.text(`MAXIMUS v74 - PROTOCOLO AUTOMATIZADO - ${empresaAtiva.nome}`, 105, 22, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    if (tipo === 'OFICIO') {
      doc.text(`OFÍCIO TÉCNICO Nº ${item.codigo}/${new Date().getFullYear()}`, 14, 45);
      doc.text(`AO ÓRGÃO AMBIENTAL (SEMAS/SEMMA)`, 14, 55);
      const corpo = `Referente ao Processo ${empresaAtiva.processo}, comunicamos o atendimento da condicionante técnica abaixo:\n\n"${item['descricao de condicionante']}"\n\nCertos de vossa atenção, aguardamos deferimento.`;
      doc.text(doc.splitTextToSize(corpo, 180), 14, 70);
    } else {
      doc.text("PROCURAÇÃO AMBIENTAL", 105, 45, { align: "center" });
      doc.text(`OUTORGANTE: ${empresaAtiva.nome}, CNPJ ${empresaAtiva.cnpj}`, 14, 60);
      doc.text(`OUTORGADO: CARDOSO & RATES ENGENHARIA`, 14, 70);
    }
    doc.save(`${tipo}_${item.codigo || 'GERAL'}.pdf`);
  };

  const filtrados = useMemo(() => {
    return condicionantes.filter(i => 
      (filtroCat === 'TODOS' || i.categoria === filtroCat) && 
      (i['descricao de condicionante']?.toLowerCase().includes(busca.toLowerCase()))
    );
  }, [condicionantes, busca, filtroCat]);

  if (loading) return <div style={styles.loader}><h2>🚀 MAXIMUS v74 PhD: CONFIGURANDO AMBIENTE...</h2></div>;

  return (
    <div style={styles.app}>
      {/* SIDEBAR TÉCNICA */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}><ShieldCheck color="#25d366" size={28}/> MAXIMUS</div>
        
        <div style={styles.menuTitle}>CLIENTE SELECIONADO</div>
        <select style={styles.select} onChange={(e) => setEmpresaAtiva(empresas.find(em => em.id === parseInt(e.target.value)))}>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>

        <div style={styles.menuTitle}>CATEGORIAS (417 ITENS)</div>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
          <div key={cat} onClick={() => setFiltroCat(cat)} style={{...styles.navLink, color: filtroCat === cat ? '#25d366' : '#888'}}>
             {cat}
          </div>
        ))}

        <div style={styles.menuTitle}>BASE LEGAL (PARÁ)</div>
        {baseLeis.map(lei => (
          <div key={lei.id} style={styles.leiCard} title={lei.ref}>
            <Gavel size={12}/> {lei.norma}
          </div>
        ))}

        <button style={styles.btnSide} onClick={() => gerarDocumento('PROCURACAO')}><FileText size={16}/> Nova Procuração</button>
      </aside>

      {/* PAINEL DE OPERAÇÕES */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchBar}>
            <Search size={18} color="#666"/>
            <input style={styles.input} placeholder="Pesquisar em toda a base técnica..." onChange={(e) => setBusca(e.target.value)} />
          </div>
          <button style={styles.btnImprimir} onClick={() => window.print()}><Printer size={18}/> IMPRIMIR</button>
        </header>

        {/* DASHBOARD DE PRAZOS */}
        <section style={styles.dashPrazos}>
           <div style={styles.cardPrazo}>
             <Clock color="#25d366"/>
             <div>
               <span>PRÓXIMO VENCIMENTO</span>
               <h3>15 Dias - SEMAS</h3>
             </div>
           </div>
           <div style={styles.cardPrazo}>
             <Calendar color="#ffc107"/>
             <div>
               <span>ITENS EM ANÁLISE</span>
               <h3>{filtrados.length} Itens</h3>
             </div>
           </div>
           <div style={styles.cardPrazo}>
             <CheckCircle2 color="#25d366"/>
             <div>
               <span>PROCESSO ATIVO</span>
               <h3>{empresaAtiva.processo}</h3>
             </div>
           </div>
        </section>

        {/* LISTA DE AUDITORIA */}
        <div style={styles.tableArea}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>CÓD</th>
                <th>DESCRIÇÃO TÉCNICA E JURÍDICA</th>
                <th>DOCS</th>
                <th>STATUS</th>
                <th>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={{color:'#25d366', fontWeight:'bold'}}>{item.codigo}</td>
                  <td style={styles.tdDesc}>{item['descricao de condicionante']}</td>
                  <td><Download size={18} color="#444" style={{cursor:'pointer'}}/></td>
                  <td>
                    <select style={styles.statusSelect}>
                      <option>PENDENTE</option>
                      <option>CONFORME</option>
                      <option>N/A</option>
                    </select>
                  </td>
                  <td>
                    <button style={styles.btnDoc} onClick={() => gerarDocumento('OFICIO', item)}><FileText size={14}/></button>
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
  app: { display: 'flex', height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#0d0d0d', padding: '20px', borderRight: '1px solid #222' },
  logo: { fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  menuTitle: { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '25px', marginBottom: '10px', letterSpacing: '1px' },
  select: { width: '100%', padding: '10px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '5px' },
  navLink: { padding: '8px 0', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  leiCard: { fontSize: '11px', color: '#666', padding: '5px', borderBottom: '1px solid #1a1a1a', cursor: 'help' },
  btnSide: { width: '100%', marginTop: '20px', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
  searchBar: { flex: 1, backgroundColor: '#111', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 20px', marginRight: '20px', border: '1px solid #222' },
  input: { background: 'transparent', border: 'none', color: '#fff', width: '100%', padding: '15px', outline: 'none' },
  btnImprimir: { background: '#111', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  dashPrazos: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' },
  cardPrazo: { background: '#0d0d0d', padding: '20px', borderRadius: '12px', border: '1px solid #222', display: 'flex', gap: '15px', alignItems: 'center' },
  tableArea: { background: '#0d0d0d', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #1a1a1a' },
  tdDesc: { padding: '15px', fontSize: '13px', color: '#ccc', width: '60%' },
  statusSelect: { background: '#1a1a1a', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px' },
  btnDoc: { background: '#222', border: '1px solid #333', color: '#25d366', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#25d366' }
};

export default App;
