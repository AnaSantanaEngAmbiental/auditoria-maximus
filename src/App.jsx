import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, FilePlus, 
  Scale, PenTool, BarChart3, Truck, Zap, MessageCircle, 
  Download, FileText, Globe, Building, Mail, Send
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV60() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Mineracao');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [cadastro, setCadastro] = useState({ cnpj: '', email: '', whatsapp: '', responsavel: '' });

  const fileInputRef = useRef(null);

  // 1. SINCRONIZAÇÃO TOTAL (AUDITORIA + CADASTRO + ARQUIVOS)
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function init() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      
      const savedCad = localStorage.getItem(`MAX_CAD_${projeto}`);
      setCadastro(savedCad ? JSON.parse(savedCad) : { cnpj: '', email: '', whatsapp: '', responsavel: '' });
      
      setLoading(false);
    }
    init();
  }, [projeto]);

  // 2. MOTOR DE VALIDAÇÃO (CRITERIOSO)
  const isValido = (termo) => {
    return arquivos.some(a => a.nome.includes(String(termo).toUpperCase()));
  };

  // 3. UPLOAD E ATUALIZAÇÃO IMEDIATA
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const novos = files.map(f => ({ nome: f.name.toUpperCase(), id: Date.now() + Math.random() }));
    
    setArquivos(prev => {
      const listaFinal = [...prev, ...novos];
      localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaFinal));
      return listaFinal;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 4. ENVIO WHATSAPP (INTEGRADO AO CADASTRO)
  const enviarZap = () => {
    if (!cadastro.whatsapp) return alert("Cadastre o WhatsApp na aba DADOS DA EMPRESA primeiro!");
    const msg = `Olá, Relatório de Auditoria Maximus PhD - Unidade: ${projeto}. CNPJ: ${cadastro.cnpj}. Status: ${arquivos.length} documentos validados.`;
    window.open(`https://wa.me/55${cadastro.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 5. GERAÇÃO DE RELATÓRIO COMPLETO (DOCX/TXT)
  const gerarRelatorio = () => {
    const header = `MAXIMUS PhD - RELATÓRIO TÉCNICO\nUNIDADE: ${projeto}\nCNPJ: ${cadastro.cnpj}\nRESPONSÁVEL: ${cadastro.responsavel}\n\n`;
    const corpo = items.map(it => `${it.codigo} - ${isValido(it.codigo) ? '[OK]' : '[PENDENTE]'} - ${it.descricao_de_condicionante.substring(0, 100)}...`).join('\n');
    const blob = new Blob([header + corpo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_${projeto}.doc`;
    link.click();
    
    // Sugestão: Após gerar, oferece para enviar por e-mail
    if (cadastro.email) {
      setTimeout(() => {
        if(window.confirm("Relatório gerado! Deseja abrir o e-mail para envio ao gestor?")) {
           window.location.href = `mailto:${cadastro.email}?subject=Relatório de Auditoria: ${projeto}&body=Segue anexo o relatório técnico gerado pelo Maximus PhD.`;
        }
      }, 1000);
    }
  };

  if (loading) return <div style={s.load}><Zap color="#0f0" className="animate-pulse" size={50}/> <br/> VARREDURA MAXIMUS...</div>;

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={s.brand}><Shield color="#0f0" size={35}/> MAXIMUS <span style={{color:'#0f0'}}>PhD</span></div>
        
        <label style={s.labMini}>UNIDADE</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ MINERAÇÃO</option>
          <option value="Logistica">🚚 LOGÍSTICA / FROTA</option>
          <option value="Posto">⛽ POSTO COMBUSTÍVEL</option>
        </select>

        <nav style={s.menu}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.menuBtnA:s.menuBtn}><Scale size={20}/> AUDITORIA TÉCNICA</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.menuBtnA:s.menuBtn}><Truck size={20}/> FROTA / CIPP</button>
          <button onClick={()=>setAba('CADASTRO')} style={aba==='CADASTRO'?s.menuBtnA:s.menuBtn}><Building size={20}/> DADOS DA EMPRESA</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.menuBtnA:s.menuBtn}><PenTool size={20}/> ASSINAR GOV.BR</button>
        </nav>

        <div style={s.statusBox}>
          <div style={s.statusHead}>CONFORMIDADE</div>
          <div style={{padding:20, textAlign:'center'}}>
            <h1 style={{color:'#0f0', fontSize:40, margin:0}}>{((arquivos.length/(items.length||1))*100).toFixed(0)}%</h1>
            <div style={s.bar}><div style={{...s.barIn, width:`${(arquivos.length/(items.length||1))*100}%`}}></div></div>
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={s.searchBar}><Search color="#444" size={24}/><input placeholder="FILTRAR REQUISITOS..." style={s.input} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={enviarZap} style={s.btnZap}><MessageCircle size={18}/> WHATSAPP</button>
             <button onClick={gerarRelatorio} style={s.btnDoc}><FileText size={18}/> RELATÓRIO</button>
             <label style={s.btnUp}><FilePlus size={18}/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
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

          {aba === 'FROTA' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0', marginBottom:40}}>Controle Operacional de Frota</h1>
              {['CIPP', 'CIV', 'MOPP', 'ANTT', 'LICENÇA'].map(cert => (
                <div key={cert} style={s.cardFrota}>
                  <div style={{display:'flex', gap:20, alignItems:'center'}}><Truck size={30} color={isValido(cert)?'#0f0':'#333'}/> <b style={{fontSize:22}}>{cert}</b></div>
                  <div style={{color: isValido(cert)?'#0f0':'#f00', fontWeight:'bold', fontSize:20}}>{isValido(cert)?'VALIDADO ✓':'PENDENTE X'}</div>
                </div>
              ))}
            </div>
          )}

          {aba === 'CADASTRO' && (
            <div style={s.pad}>
              <h1 style={{color:'#0f0', marginBottom:40}}>Dados da Unidade: {projeto}</h1>
              <div style={s.grid}>
                <div style={s.field}><label>CNPJ</label><input value={cadastro.cnpj} onChange={e=>setCadastro({...cadastro, cnpj:e.target.value})} onBlur={()=>localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro))} placeholder="00.000.000/0000-00" style={s.in}/></div>
                <div style={s.field}><label>E-MAIL GESTOR</label><input value={cadastro.email} onChange={e=>setCadastro({...cadastro, email:e.target.value})} onBlur={()=>localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro))} placeholder="gestor@empresa.com" style={s.in}/></div>
                <div style={s.field}><label>WHATSAPP (COM DDD)</label><input value={cadastro.whatsapp} onChange={e=>setCadastro({...cadastro, whatsapp:e.target.value})} onBlur={()=>localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro))} placeholder="91988887777" style={s.in}/></div>
                <div style={s.field}><label>RESPONSÁVEL TÉCNICO</label><input value={cadastro.responsavel} onChange={e=>setCadastro({...cadastro, responsavel:e.target.value})} onBlur={()=>localStorage.setItem(`MAX_CAD_${projeto}`, JSON.stringify(cadastro))} placeholder="Nome do Auditor" style={s.in}/></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' },
  load: { height: '100vh', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', background: '#000', color:'#0f0' },
  sidebar: { width: '400px', background: '#080808', borderRight: '1px solid #111', padding: '35px', display: 'flex', flexDirection: 'column' },
  brand: { fontSize: 28, fontWeight: 900, marginBottom: 40, display: 'flex', gap: 10, alignItems: 'center' },
  labMini: { fontSize: 10, color: '#333', fontWeight: 'bold', marginBottom: 5 },
  select: { background: '#111', color: '#fff', border: '1px solid #222', padding: '18px', borderRadius: 12, marginBottom: 30, fontSize: 16, outline: 'none' },
  menu: { display: 'flex', flexDirection: 'column', gap: 8 },
  menuBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  menuBtnA: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: 12, fontSize: 16, fontWeight: 'bold' },
  statusBox: { marginTop: 'auto', background: '#020202', borderRadius: 20, border: '1px solid #111', overflow: 'hidden' },
  statusHead: { padding: '10px 20px', fontSize: 10, fontWeight: 'bold', background: '#080808', color: '#333' },
  bar: { width: '100%', height: 6, background: '#111', borderRadius: 10, marginTop: 15 },
  barIn: { height: '100%', background: '#0f0', borderRadius: 10, transition: '1s' },
  main: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 30, gap: 15 },
  searchBar: { flex: 1, background: '#080808', border: '1px solid #111', borderRadius: 20, display: 'flex', alignItems: 'center', padding: '0 25px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '20px', width: '100%', outline: 'none', fontSize: 18 },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: '900', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  btnDoc: { background: '#fff', color: '#000', padding: '12px 25px', borderRadius: 15, fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  btnZap: { background: '#25D366', color: '#fff', padding: '12px 25px', borderRadius: 15, fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 8, alignItems:'center', fontSize: 14 },
  content: { background: '#030303', borderRadius: 40, border: '1px solid #0a0a0a', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '25px', fontSize: 12, color: '#333', background: '#030303', position: 'sticky', top: 0 },
  tr: { borderBottom: '1px solid #080808' },
  tdCod: { padding: '30px', color: '#0f0', fontWeight: 'bold', fontSize: 22 },
  tdDesc: { padding: '30px', color: '#ccc', fontSize: 20, lineHeight: 1.5 },
  pad: { padding: 60 },
  cardFrota: { display:'flex', justifyContent:'space-between', padding:30, background:'#080808', border:'1px solid #111', borderRadius:20, marginBottom:15 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:30 },
  field: { display:'flex', flexDirection:'column', gap:10 },
  in: { background:'#111', border:'1px solid #222', padding:20, borderRadius:15, color:'#fff', outline:'none', fontSize:16 },
};
