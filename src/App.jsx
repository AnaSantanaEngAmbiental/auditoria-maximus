import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ShieldCheck, FileText, Search, Clock, 
  AlertTriangle, Printer, Gavel, Users, 
  Download, Scale, RotateCcw, Calendar, 
  Landmark, Briefcase, CheckCircle2, UploadCloud, 
  Truck, Save, Edit3, Trash2, ChevronRight
} from 'lucide-react';

// Configuração Blindada do Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV90() {
  // --- ESTADOS DE ALTO NÍVEL ---
  const [empresas, setEmpresas] = useState([]);
  const [empresaAtiva, setEmpresaAtiva] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [auditData, setAuditData] = useState({});
  const [arquivos, setArquivos] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [aba, setAba] = useState('DASHBOARD');
  const [loading, setLoading] = useState(true);

  // --- CARREGAMENTO INICIAL (VARREDURA) ---
  useEffect(() => {
    carregarConfiguracaoInicial();
  }, []);

  const carregarConfiguracaoInicial = async () => {
    setLoading(true);
    const { data: listEmpresas } = await supabase.from('empresas_phd').select('*');
    setEmpresas(listEmpresas || []);
    if (listEmpresas?.length > 0) setEmpresaAtiva(listEmpresas[0]);
    setLoading(false);
  };

  useEffect(() => {
    if (empresaAtiva) sincronizarDadosEmpresa();
  }, [empresaAtiva]);

  const sincronizarDadosEmpresa = async () => {
    setLoading(true);
    const [resRequisitos, resAudit, resFiles] = await Promise.all([
      supabase.from('base_condicionantes').select('*').order('codigo'),
      supabase.from('auditoria_itens').select('*').eq('empresa_id', empresaAtiva.id),
      supabase.from('auditoria_arquivos').select('*').eq('empresa_id', empresaAtiva.id)
    ]);

    setRequisitos(resRequisitos.data || []);
    setArquivos(resFiles.data || []);
    
    const mapped = {};
    resAudit.data?.forEach(row => { mapped[row.codigo_item] = row; });
    setAuditData(mapped);
    setLoading(false);
  };

  // --- ENGENHARIA DE DOCUMENTOS PhD ---
  const gerarOficioSemas = () => {
    const doc = new jsPDF();
    const dataH = new Date().toLocaleDateString('pt-BR');
    
    doc.setFont("helvetica", "bold");
    doc.text("PROJETO MAXIMUS PhD - RELATÓRIO DE ENGENHARIA", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`AO: ÓRGÃO AMBIENTAL COMPETENTE (SEMAS/PA)`, 14, 35);
    doc.text(`REF: PROCESSO Nº ${empresaAtiva.processo_numero}`, 14, 40);

    const textoBase = `A ${empresaAtiva.razao_social}, através de seu corpo técnico PhD, apresenta as evidências de conformidade para a atividade de ${empresaAtiva.tipo_atividade}. Analisamos os itens de segurança veicular (CIV/CIPP) e o extrato ANTT.`;
    
    const splitText = doc.splitTextToSize(textoBase, 180);
    doc.setFont("helvetica", "normal");
    doc.text(splitText, 14, 55);

    const rows = requisitos.map(r => [
      r.codigo, 
      r.descricao_de_condicionante?.substring(0, 90),
      auditData[r.codigo]?.conformidade ? 'CONFORME' : 'EM ANÁLISE'
    ]);

    doc.autoTable({
      startY: 80,
      head: [['ITEM', 'CONDICIONANTE', 'STATUS PhD']],
      body: rows,
      headStyles: { fillStyle: [0, 80, 0] }
    });

    doc.save(`Oficio_PhD_${empresaAtiva.razao_social}.pdf`);
  };

  // --- LÓGICA DE VIGÊNCIA (ANALISADOR PHD) ---
  const analisarVigencia = (data) => {
    if (!data) return { cor: '#1a1a1a', label: 'N/A' };
    const dias = Math.ceil((new Date(data) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { cor: '#4a0000', label: 'VENCIDO' };
    if (dias <= 30) return { cor: '#4a4a00', label: 'URGENTE' };
    return { cor: '#003300', label: 'OK' };
  };

  if (loading) return <div style={s.load}><RotateCcw className="animate-spin" size={60}/> <span>AUDITANDO SISTEMA...</span></div>;

  return (
    <div style={s.container}>
      {/* MENU LATERAL DE ALTO IMPACTO */}
      <aside style={s.side}>
        <div style={s.brand}><ShieldCheck color="#0f0" size={40}/> MAXIMUS <span style={{color:'#fff'}}>PhD</span></div>
        
        <div style={s.empresaBox}>
          <label style={s.labelMini}>UNIDADE EM FOCO:</label>
          <select 
            style={s.select}
            value={empresaAtiva?.id}
            onChange={(e) => setEmpresaAtiva(empresas.find(emp => emp.id === e.target.value))}
          >
            {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
          </select>
        </div>

        <nav style={s.nav}>
          <button onClick={()=>setAba('DASHBOARD')} style={aba==='DASHBOARD'?s.btnA:s.btn}><Scale size={26}/> Auditoria Técnica</button>
          <button onClick={()=>setAba('DOCUMENTOS')} style={aba==='DOCUMENTOS'?s.btnA:s.btn}><FileText size={26}/> Fábrica de Ofícios</button>
          <button onClick={()=>setAba('ANTT')} style={aba==='ANTT'?s.btnA:s.btn}><Truck size={26}/> Extrato ANTT</button>
        </nav>

        <div style={s.statsCard}>
           <div style={{fontSize: 12, color: '#444'}}>CONFORMIDADE GLOBAL</div>
           <div style={{fontSize: 35, fontWeight: '900', color: '#0f0'}}>89%</div>
           <div style={s.progress}><div style={{...s.progressIn, width: '89%'}}></div></div>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL (FONTE 20) */}
      <main style={s.main}>
        {aba === 'DASHBOARD' ? (
          <div style={s.grid}>
            {/* TABELA DE REQUISITOS */}
            <div style={s.panelLeft}>
              <div style={s.scroll}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.th}>
                      <th style={{width: 100}}>CÓDIGO</th>
                      <th>REQUISITO DA LICENÇA AMBIENTAL</th>
                      <th style={{textAlign:'center'}}>VIGÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitos.map((it, idx) => {
                      const vig = analisarVigencia(auditData[it.codigo]?.validade_civ);
                      return (
                        <tr key={idx} style={{...s.tr, background: itemSelecionado?.codigo === it.codigo ? '#0f01' : 'transparent'}} onClick={() => setItemSelecionado(it)}>
                          <td style={s.tdCod}>{it.codigo}</td>
                          <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                          <td style={{...s.tdVig, background: vig.cor}}>{vig.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAINEL DE ANALISE PHD */}
            <div style={s.panelRight}>
              {itemSelecionado ? (
                <div style={s.phdContent}>
                  <h1 style={{fontSize: 48, color: '#0f0', margin: 0}}>ITEM {itemSelecionado.codigo}</h1>
                  
                  <div style={s.cardPhd}>
                    <label style={s.labelMini}>PARECER DO DOUTOR EM REDAÇÃO:</label>
                    <p style={s.txtSugestao}>
                      O item mencionado requer a apresentação do certificado de descontaminação e CIV. Recomendamos anexar o documento em PDF para validação imediata junto à SEMAS.
                    </p>
                  </div>

                  <div style={s.cardPhd}>
                    <label style={s.labelMini}>DADOS TÉCNICOS (CIPP/ANTT/PLACA):</label>
                    <input 
                      style={s.inputPhd} 
                      placeholder="PLACA / DOC" 
                      value={auditData[itemSelecionado.codigo]?.placa_veiculo || ''}
                      onChange={async (e) => {
                         const v = e.target.value.toUpperCase();
                         setAuditData(p => ({...p, [itemSelecionado.codigo]: {...p[itemSelecionado.codigo], placa_veiculo: v}}));
                         await supabase.from('auditoria_itens').upsert({empresa_id: empresaAtiva.id, codigo_item: itemSelecionado.codigo, placa_veiculo: v});
                      }}
                    />
                  </div>

                  <div style={s.dropArea}>
                     <UploadCloud size={60} color="#151515"/>
                     <p style={{fontSize: 24, fontWeight:'bold', color: '#1a1a1a'}}>ARRASTE EVIDÊNCIA</p>
                  </div>
                </div>
              ) : (
                <div style={s.empty}><Landmark size={150} color="#050505"/><h2>Aguardando seleção técnica...</h2></div>
              )}
            </div>
          </div>
        ) : (
          <div style={s.panelDocs}>
             <h1 style={{fontSize: 45, color:'#0f0'}}>Fábrica de Documentos PhD</h1>
             <div style={s.docGrid}>
                <div style={s.docCard} onClick={gerarOficioSemas}>
                   <Icon name="FileText" size={50} color="#0f0"/>
                   <h3>Gerar Ofício SEMAS</h3>
                   <p>Redação oficial padrão para licenciamento estadual.</p>
                </div>
                <div style={s.docCard}>
                   <Icon name="Save" size={50} color="#0f0"/>
                   <h3>Exportar XLSX</h3>
                   <p>Planilha de controle de frotas e prazos.</p>
                </div>
                <div style={s.docCard}>
                   <Icon name="Edit3" size={50} color="#0f0"/>
                   <h3>Relatório Fotográfico</h3>
                   <p>Gerar PDF/DOCX com fotos legendadas automaticamente.</p>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper para evitar erros de ícone não definido
const Icon = ({ name, ...props }) => {
  const Lib = { FileText, Save, Edit3 };
  const Target = Lib[name] || AlertTriangle;
  return <Target {...props} />;
};

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontSize: '20px', fontFamily: 'Inter, sans-serif' },
  load: { height: '100vh', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#0f0', gap:20 },
  side: { width: '400px', background: '#080808', padding: '40px', borderRight: '1px solid #111', display:'flex', flexDirection:'column' },
  brand: { fontSize: '32px', fontWeight: 900, color: '#0f0', marginBottom: 50, display:'flex', gap: 15, alignItems:'center' },
  empresaBox: { marginBottom: 40 },
  labelMini: { fontSize: '12px', color: '#444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, display: 'block' },
  select: { background: '#111', color: '#fff', border: '2px solid #222', padding: '20px', borderRadius: 15, width: '100%', fontSize: '18px', outline:'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: 15, flex: 1 },
  btn: { display: 'flex', gap: 15, padding: 25, background: 'none', border: 'none', color: '#333', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', borderRadius: 15 },
  btnA: { display: 'flex', gap: 15, padding: 25, background: '#111', border: '2px solid #0f0', color: '#0f0', fontSize: '22px', fontWeight: 'bold', borderRadius: 15, textAlign: 'left' },
  statsCard: { background: '#020202', padding: 25, borderRadius: 25, border: '1px solid #111' },
  progress: { height: 8, background: '#111', borderRadius: 10, marginTop: 15, overflow: 'hidden' },
  progressIn: { height: '100%', background: '#0f0' },
  main: { flex: 1, padding: '40px', overflow: 'hidden' },
  grid: { display: 'flex', gap: '40px', height: '100%' },
  panelLeft: { flex: 1.5, background: '#020202', borderRadius: 30, border: '1px solid #111', overflow: 'hidden' },
  panelRight: { flex: 1, background: '#080808', borderRadius: 30, border: '1px solid #111', padding: '40px', overflowY: 'auto' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 30px', color: '#222', background: '#080808', fontSize: '14px' },
  tr: { borderBottom: '1px solid #0a0a0a', cursor: 'pointer' },
  tdCod: { padding: '35px', color: '#0f0', fontSize: '38px', fontWeight: '900' },
  tdDesc: { padding: '35px', color: '#ccc', fontSize: '22px', lineHeight: '1.5' },
  tdVig: { padding: '15px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' },
  phdContent: { display:'flex', flexDirection: 'column', gap: 30 },
  cardPhd: { background: '#000', padding: '30px', borderRadius: '25px', border: '1px solid #151515' },
  txtSugestao: { color: '#0f0', fontSize: '24px', lineHeight: '1.6' },
  inputPhd: { background: '#0a0a0a', border: '2px solid #222', color: '#fff', padding: '25px', borderRadius: '15px', fontSize: '28px', width: '90%', outline: 'none' },
  dropArea: { border: '5px dashed #111', borderRadius: '30px', padding: '60px', textAlign: 'center' },
  panelDocs: { height: '100%' },
  docGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30, marginTop: 40 },
  docCard: { background: '#080808', padding: 40, borderRadius: 30, border: '1px solid #111', textAlign:'center', cursor: 'pointer' },
  empty: { height: '100%', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity: 0.1 }
};
