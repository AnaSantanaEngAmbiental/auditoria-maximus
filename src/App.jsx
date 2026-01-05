import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, FileText, Map as MapIcon, Globe, MapPin, Settings, Building, Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV59() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dados de Cadastro da Empresa (Funcionalidade #10 e #25)
  const [cadastro, setCadastro] = useState({
    cnpj: '',
    email: '',
    whatsapp: '',
    responsavel: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function carregar() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      // Carregar Arquivos
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      
      // Carregar Cadastro da Empresa
      const savedCad = localStorage.getItem(`MAX_CAD_${projeto}`);
      setCadastro(savedCad ? JSON.parse(savedCad) : { cnpj: '', email: '', whatsapp: '', responsavel: '' });
      
      setLoading(false);
    }
    carregar();
  }, [projeto]);

  // Salvar Cadastro
  const salvarCadastro = (e) => {
    const { name, value } = e.target;
    const novoCad = { ...cadastro, [name]: value };
    setCadastro(novoCad);
    localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(novoCad));
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: `${f.name}-${Date.now()}` }));
    const listaAtual = JSON.parse(localStorage.getItem(`MAX_FILES_${projeto}`) || '[]');
    const listaFinal = [...listaAtual, ...novos];
    localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaFinal));
    setArquivos(listaFinal); 
  };

  // --- GERAÇÃO DE RELATÓRIO DOCX (SIMULAÇÃO DE ESTRUTURA) ---
  const gerarDocx = () => {
    const conteudo = `
      RELATÓRIO DE AUDITORIA AMBIENTAL - MAXIMUS PhD
      EMPRESA: ${projeto} | CNPJ: ${cadastro.cnpj}
      RESPONSÁVEL: ${cadastro.responsavel}
      --------------------------------------------------
      TOTAL DE REQUISITOS: ${items.length}
      EM CONFORMIDADE: ${arquivos.length}
      PENDENTES: ${items.length - arquivos.length}
      --------------------------------------------------
      Gerado em: ${new Date().toLocaleString()}
    `;
    const blob = new Blob([conteudo], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_${projeto}.doc`;
    link.click();
  };

  const isValido = (cod) => arquivos.some(a => a.nome.includes(String(cod).toUpperCase()));

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={50}/> SINCRONIZANDO UNIDADE...</div>;

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={s.brand}><Shield color="#0f0" size={35}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <label style={s.labelMini}>UNIDADE OPERACIONAL</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao_PA">⛏️ VALE - PARAUAPEBAS</option>
          <option value="Logistica_BAR">🚚 HYDRO - BARCARENA</option>
          <option value="Posto_BEL">⛽ POSTO IPIRANGA - BELÉM</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale size={20}/> AUDITORIA</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.menuBtnA:s.menuBtn}><Building size={20}/> DADOS DA EMPRESA</button>
          <button onClick={()=>setAba('MAPA')} style={aba==='MAPA'?s.menuBtnA:s.menuBtn}><Globe size={20}/> MAPA DE RISCO</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.menuBtnA:s.menuBtn}><PenTool size={20}/> ASSINAR GOV.BR</button>
        </nav>

        <div style={s.monitor}>
          <div style={s.monHead}>SITUAÇÃO ATUAL</div>
          <div style={{padding:20}}>
            <h2 style={{color:'#0f0', fontSize:30}}>{((arquivos.length/items.length)*100).toFixed(0)}%</h2>
            <p style={{fontSize:11, color:'#444'}}>Conformidade Legal</p>
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}><Search color="#444" size={24}/><input placeholder="BUSCAR CONDICIONANTE..." style={s.input} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={gerarDocx} style={s.btnEx}><FileText size={18}/> GERAR DOCX</button>
             <label style={s.btnUp}><FilePlus size={18}/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO LEGAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it, idx)=>(
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdCod}>{it.codigo}</td>
                      <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={isValido(it.codigo)?'#0f0':'#111'} size={38}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0', marginBottom:40}}>Configuração da Unidade</h1>
              <div style={s.grid}>
                <div style={s.field}><label>CNPJ DA UNIDADE</label><input name="cnpj" value={cadastro.cnpj} onChange={salvarCadastro} placeholder="00.000.000/0000-00" style={s.in}/></div>
                <div style={s.field}><label>RESPONSÁVEL TÉCNICO</label><input name="responsavel" value={cadastro.responsavel} onChange={salvarCadastro} placeholder="Nome do Engenheiro/Auditor" style={s.in}/></div>
                <div style={s.field}><label>E-MAIL PARA RELATÓRIOS</label><input name="email" value={cadastro.email} onChange={salvarCadastro} placeholder="email@empresa.com" style={s.in}/></div>
                <div style={s.field}><label>WHATSAPP DE ALERTA</label><input name="whatsapp" value={cadastro.whatsapp} onChange={salvarCadastro} placeholder="91999999999" style={s.in}/></div>
              </div>
              <p style={{marginTop:30, color:'#444'}}>* Os dados acima são salvos automaticamente para o projeto <b>{projeto}</b>.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0' },
  sidebar: { width: '400px', background: '#080808', borderRight: '1px solid #111', padding: '30px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 28, fontWeight: 900, marginBottom: 40, display: 'flex', gap: 10, alignItems: 'center' },
  labelMini: { fontSize: 10, color: '#333', fontWeight: 'bold', marginBottom: 5 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '18px', borderRadius: 12, marginBottom: 30, fontSize: 16, outline: 'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 8 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '18px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 12, padding: '18px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  monitor: { marginTop: 'auto', background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden' },
  monHead: { padding: '10px 20px', fontSize: 10, fontWeight: 'bold', background: '#080808', color: '#333' },
  main: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 30, gap: 20 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 20, display: 'flex', alignItems: 'center', padding: '0 25px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '20px', width: '100%', outline: 'none', fontSize: 18 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  btnEx: { background: '#111', color: '#fff', border:'1px solid #222', padding: '12px 20px', borderRadius: 15, fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '25px', fontSize: 12, color: '#333', background: '#030303', position: 'sticky', top: 0 },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '30px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '30px', color: '#ccc', fontSize: 20, lineHeight: 1.5 },
  pad: { padding: 60 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:30 },
  field: { display:'flex', flexDirection:'column', gap:10 },
  in: { background:'#111', border:'1px solid #222', padding:20, borderRadius:15, color:'#fff', outline:'none', fontSize:16 },
  label: { fontSize:12, color:'#444', fontWeight:'bold' }
};
