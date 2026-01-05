import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, 
  FilePlus, History, Save, Building2, Map, Scale, Download,
  Wifi, WifiOff, PenTool, Bell, Zap, Cpu
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV51() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Geral');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Refs para controle rigoroso de DOM
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO E SINCRONIA
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function init() {
      setLoading(true);
      const { data } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (data) setItems(data);
      
      const savedFiles = localStorage.getItem(`MAX_FILES_${projeto}`);
      setArquivos(savedFiles ? JSON.parse(savedFiles) : []);
      setLoading(false);
    }
    init();
  }, [projeto]);

  // 2. CORREÇÃO DEFINITIVA DE UPLOAD (SOLUÇÃO DO SEU PROBLEMA)
  const processarUpload = (files) => {
    if (!files || files.length === 0) return;

    const novosDocs = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleDateString('pt-BR'),
      idUnique: `${f.name}-${f.size}-${Date.now()}` // ID único para evitar conflito
    }));

    setArquivos(prev => {
      const nomesExistentes = new Set(prev.map(a => a.nome));
      // Filtra duplicatas, mas permite re-adicionar se foi deletado
      const filtrados = novosDocs.filter(n => !nomesExistentes.has(n.nome));
      const listaAtualizada = [...prev, ...filtrados];
      localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(listaAtualizada));
      return listaAtualizada;
    });

    // --- O PULO DO GATO: RESET DO INPUT ---
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Limpa o valor para permitir re-upload do mesmo arquivo
    }
  };

  // 3. RESET TOTAL (LIMPEZA DE CACHE)
  const resetarSistema = () => {
    if (window.confirm("Deseja apagar todas as evidências deste projeto?")) {
      setArquivos([]);
      localStorage.removeItem(`MAX_FILES_${projeto}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. MOTOR DE VALIDAÇÃO (REGEX)
  const validar = useCallback((id) => {
    if (!id || arquivos.length === 0) return false;
    const nomes = arquivos.map(a => a.nome);
    const regras = {
      CIPP: /\b(CIPP|CTPP|5\.1)\b/,
      CIV: /\b(CIV|CRLV|3\.1)\b/,
      MOPP: /\b(MOPP|CURSO|CNH)\b/
    };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  }, [arquivos]);

  if (loading) return <div style={s.load}><Zap className="animate-pulse" size={40}/></div>;

  return (
    <div style={s.body} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); processarUpload(e.dataTransfer.files)}}>
      
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS <span style={s.v}>v51</span></div>
        
        <label style={s.label}>EMPREENDIMENTO ATIVO</label>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao">⛏️ Mineração Parauapebas</option>
          <option value="Logistica">🚚 Logística Barcarena</option>
          <option value="Posto">⛽ Postos Belém</option>
        </select>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> Auditoria</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><PieChart size={18}/> Dashboard</button>
        </nav>

        <div style={s.boxArq}>
          <div style={s.boxHead}>
            EVIDÊNCIAS ({arquivos.length}) 
            <Trash2 size={14} onClick={resetarSistema} style={{cursor:'pointer', color:'#f00'}}/>
          </div>
          <div style={s.boxLista}>
            {arquivos.map((a,i)=>(<div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.slice(0,25)}</div>))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18}/><input placeholder="Buscar leis ou códigos..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <label style={s.btnUp}>
               <FilePlus size={18}/> ADICIONAR DOCUMENTOS 
               <input 
                 ref={fileInputRef} 
                 type="file" 
                 multiple 
                 hidden 
                 onChange={e => processarUpload(e.target.files)}
               />
             </label>
          </div>
        </header>

        <div style={s.content}>
          <div style={s.scroll}>
            <table style={s.table}>
              <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO AMBIENTAL</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
              <tbody>
                {items.filter(i => i.descricao_de_condicionante?.toLowerCase().includes(busca.toLowerCase())).map((it,i)=>(
                  <tr key={i} style={s.tr}>
                    <td style={s.tdC}>{it.codigo}</td>
                    <td style={s.tdD}>
                      {it.descricao_de_condicionante}
                      <div style={s.iaBox}><Cpu size={12}/> Sugestão: Documento técnico oficial</div>
                    </td>
                    <td style={{textAlign:'center'}}><Camera color={validar(it.codigo)?'#0f0':'#111'} size={24}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow:'hidden' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0', background: '#000' },
  side: { width: '320px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '30px', color: '#0f0', display: 'flex', gap: 10 },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 5px', borderRadius: '4px' },
  label: { fontSize: '10px', color: '#333', marginBottom: '8px', fontWeight:'bold', textTransform: 'uppercase' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '10px', marginBottom: '25px', outline: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
  btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '10px' },
  boxArq: { flex: 1, marginTop: 20, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '15px', fontSize: '11px', borderBottom: '1px solid #111', color: '#444', display:'flex', justifyContent:'space-between', alignItems:'center' },
  boxLista: { padding: '15px', overflowY: 'auto', flex: 1 },
  itemArq: { fontSize: '10px', color: '#555', marginBottom: '8px', display:'flex', gap:8, borderBottom: '1px solid #080808', paddingBottom: 4 },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: 20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 10, alignItems:'center' },
  content: { background: '#050505', borderRadius: '30px', border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', background:'#050505', position:'sticky', top:0 },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdD: { padding: '20px', color: '#888', fontSize: '13px', lineHeight: '1.6' },
  iaBox: { fontSize: '10px', color: '#0f0', marginTop: 8, display: 'flex', gap: 5, alignItems: 'center', opacity: 0.7 }
};
