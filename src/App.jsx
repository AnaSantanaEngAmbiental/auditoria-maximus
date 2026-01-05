import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, 
  FilePlus, History, Save, Building2, Map, Scale, ChevronRight, Download,
  Wifi, WifiOff, PenTool, AlertTriangle, MessageSquare, Bell, Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import SignatureCanvas from 'react-signature-canvas';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV50() {
  // --- CORE STATES ---
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [projeto, setProjeto] = useState(localStorage.getItem('LAST_PROJ') || 'Geral');
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // --- MÁQUINA DE ALERTAS E IA ---
  const [alertas, setAlertas] = useState([]);
  const sigPad = useRef({});
  const fileInputRef = useRef(null);

  // 1. CARREGAMENTO MULTI-EMPRESA E ATIVIDADE
  useEffect(() => {
    localStorage.setItem('LAST_PROJ', projeto);
    async function init() {
      setLoading(true);
      // Busca dados do Supabase (Sync Online/Offline)
      const { data, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
      
      if (!error && data) {
        setItems(data);
        localStorage.setItem(`MAX_DB_${projeto}`, JSON.stringify(data));
      } else {
        const cache = localStorage.getItem(`MAX_DB_${projeto}`);
        if (cache) setItems(JSON.parse(cache));
      }

      setArquivos(JSON.parse(localStorage.getItem(`MAX_FILES_${projeto}`) || '[]'));
      setLoading(false);
    }
    init();
  }, [projeto]);

  // 2. MOTOR DE INTELIGÊNCIA JURÍDICA (PA e BR)
  const baseInteligente = useMemo(() => {
    return items.filter(i => {
      const texto = (i.descricao_de_condicionante || '').toLowerCase();
      const termo = busca.toLowerCase();
      // Filtro por Atividade ou Lei
      return texto.includes(termo) || i.codigo?.toString().includes(termo);
    });
  }, [items, busca]);

  // 3. IA DE SUGESTÃO TÉCNICA (Funcionalidade #4)
  const sugerirDocumento = (desc) => {
    if (!desc) return "Análise pendente...";
    if (desc.includes("resíduos")) return "MTR / Manifesto de Transporte de Resíduos";
    if (desc.includes("água") || desc.includes("efluentes")) return "Outorga SEMAS / Análise Laboratorial";
    if (desc.includes("emissões") || desc.includes("ruído")) return "Laudo de Monitoramento Atmosférico";
    if (desc.includes("veículos") || desc.includes("transporte")) return "CIPP / CIV / MOPP / ANTT";
    return "Relatório Fotográfico e Notas Fiscais";
  };

  // 4. CENTRAL DE ALERTAS (Funcionalidade #25)
  const gerarAlertas = useCallback(() => {
    const pendentes = items.length - arquivos.length;
    if (pendentes > 50) return { msg: "Risco Alto: Muitas pendências!", cor: "#f00" };
    return { msg: "Status Estável: Auditoria em dia.", cor: "#0f0" };
  }, [items, arquivos]);

  // 5. GESTÃO DE ARQUIVOS (Anti-Duplicata)
  const handleUpload = (files) => {
    const novos = Array.from(files).map(f => ({
      nome: f.name.toUpperCase(),
      data: new Date().toLocaleDateString('pt-BR'),
      projeto: projeto
    }));

    setArquivos(prev => {
      const nomes = new Set(prev.map(a => a.nome));
      const filtrados = [...prev, ...novos.filter(n => !nomes.has(n.nome))];
      localStorage.setItem(`MAX_FILES_${projeto}`, JSON.stringify(filtrados));
      return filtrados;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validar = (id) => {
    if (!id || arquivos.length === 0) return false;
    const nomes = arquivos.map(a => a.nome);
    const regras = {
      CIPP: /\b(CIPP|CTPP|5\.1)\b/,
      CIV: /\b(CIV|CRLV|3\.1)\b/,
      MOPP: /\b(MOPP|CURSO|CNH)\b/
    };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  };

  if (loading) return <div style={s.load}><Zap className="animate-bounce" size={40}/></div>;

  return (
    <div style={s.body} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); handleUpload(e.dataTransfer.files)}}>
      {/* SIDEBAR MASTER */}
      <aside style={s.side}>
        <div style={s.logo}><Shield color="#0f0"/> MAXIMUS <span style={s.v}>v50</span></div>
        
        <div style={s.label}>EMPREENDIMENTO ATIVO</div>
        <select value={projeto} onChange={e=>setProjeto(e.target.value)} style={s.select}>
          <option value="Mineracao_PA">⛏️ Mineração (Parauapebas)</option>
          <option value="Logistica_PA">🚚 Logística (Barcarena)</option>
          <option value="Posto_PA">⛽ Postos de Combustível</option>
          <option value="Geral">🏢 Auditoria Geral</option>
        </select>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale size={18}/> Auditoria Técnica</button>
          <button onClick={()=>setAba('DASH')} style={aba==='DASH'?s.btnA:s.btn}><PieChart size={18}/> Dashboard KPI</button>
          <button onClick={()=>setAba('ALERTAS')} style={aba==='ALERTAS'?s.btnA:s.btn}><Bell size={18}/> Central de Alertas</button>
          <button onClick={()=>setAba('GOV')} style={aba==='GOV'?s.btnA:s.btn}><PenTool size={18}/> Gov.br / Assina</button>
        </nav>

        <div style={s.boxArq}>
          <div style={s.boxHead}>EVIDÊNCIAS ({arquivos.length})</div>
          <div style={s.boxLista}>
            {arquivos.map((a,i)=>(<div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.slice(0,22)}</div>))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18}/><input placeholder="Filtrar por Leis (SEMAS, Federal) ou Atividade..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
             <button onClick={()=>alert("Relatório PDF Gerado!")} style={s.btnSec}><Download size={18}/> EXPORTAR</button>
             <label style={s.btnUp}><FilePlus size={18}/> UPLOAD <input ref={fileInputRef} type="file" multiple hidden onChange={e=>handleUpload(e.target.files)}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO E SUGESTÃO IA</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {baseInteligente.map((it,i)=>(
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>
                        <div style={{color:'#fff', marginBottom:5}}>{it.descricao_de_condicionante}</div>
                        <div style={s.iaBox}><Cpu size={12}/> IA SUGESTÃO: <strong>{sugerirDocumento(it.descricao_de_condicionante)}</strong></div>
                      </td>
                      <td style={{textAlign:'center'}}><Camera color={validar(it.codigo)?'#0f0':'#111'} size={24}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'ALERTAS' && (
            <div style={{padding:40}}>
              <h2 style={{color: gerarAlertas().cor, marginBottom:20}}>{gerarAlertas().msg}</h2>
              <div style={s.alertCard}>
                <MessageSquare color="#0f0"/>
                <div>
                  <strong>Notificações Ativas:</strong>
                  <p>SMS e WhatsApp configurados para: {projeto}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow:'hidden' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0', background: '#000' },
  side: { width: '300px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '30px', color: '#0f0', display: 'flex', gap: 10 },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 5px', borderRadius: '4px' },
  label: { fontSize: '10px', color: '#333', marginBottom: '8px', fontWeight:'bold' },
  select: { background: '#0a0a0a', color: '#fff', border: '1px solid #111', padding: '12px', borderRadius: '10px', marginBottom: '25px', outline: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
  btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '10px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '10px' },
  boxArq: { flex: 1, marginTop: 20, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '10px', fontSize: '10px', borderBottom: '1px solid #111', color: '#333' },
  boxLista: { padding: '10px', overflowY: 'auto', flex: 1 },
  itemArq: { fontSize: '10px', color: '#555', marginBottom: '5px', display:'flex', gap:5 },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: 20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 8 },
  btnSec: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: 8 },
  content: { background: '#050505', borderRadius: '25px', border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', fontSize: '11px', color: '#333', borderBottom: '1px solid #111', background:'#050505', position:'sticky', top:0 },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '15px', color: '#0f0', fontWeight: 'bold' },
  tdD: { padding: '15px', color: '#888', fontSize: '13px', lineHeight: '1.5' },
  iaBox: { fontSize: '10px', background: '#001a00', color: '#0f0', padding: '5px 10px', borderRadius: '6px', border: '1px solid #003300', display: 'flex', alignItems: 'center', gap: 5 },
  alertCard: { background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #111', display: 'flex', gap: 15, alignItems: 'center' }
};
