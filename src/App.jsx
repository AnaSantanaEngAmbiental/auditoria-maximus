import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, Trash2, CheckCircle, Camera, Search, PieChart, HardHat, Truck, 
  FilePlus, FileText, Download, PenTool, RefreshCw, AlertCircle, Wifi, WifiOff, Check 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import SignatureCanvas from 'react-signature-canvas';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV46() {
  const [items, setItems] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [aba, setAba] = useState('AUDITORIA');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const sigPad = useRef({});

  // 1. MONITOR DE CONEXÃO E MODO OFFLINE
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); syncData(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    async function init() {
      const cacheItems = localStorage.getItem('MAX_OFFLINE_ITEMS');
      if (cacheItems) setItems(JSON.parse(cacheItems));

      if (navigator.onLine) {
        await syncData();
      }
      
      const cacheFiles = localStorage.getItem('MAX_V46_FILES');
      if (cacheFiles) setArquivos(JSON.parse(cacheFiles));
      setLoading(false);
    }
    init();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const syncData = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.from('base_condicionantes').select('*').order('codigo');
      if (!error && data) {
        setItems(data);
        localStorage.setItem('MAX_OFFLINE_ITEMS', JSON.stringify(data));
      }
    } catch (e) { console.log("Offline mode active"); }
    setSyncing(false);
  };

  // 2. PERSISTÊNCIA DE EVIDÊNCIAS
  useEffect(() => {
    localStorage.setItem('MAX_V46_FILES', JSON.stringify(arquivos));
  }, [arquivos]);

  // 3. MOTOR DE VALIDAÇÃO (REGEX CRITERIOSO)
  const validar = useCallback((id) => {
    if (!id || arquivos.length === 0) return false;
    const nomes = arquivos.map(a => a.nome.toUpperCase());
    const regras = {
      CIPP: /\b(CIPP|CTPP|5\.1|5\.2)\b/,
      CIV:  /\b(CIV|CRLV|3\.1|3\.2)\b/,
      MOPP: /\b(MOPP|CURSO|CNH|TREINAMENTO)\b/,
      ANTT: /\b(ANTT|RNTRC|4\.1|4\.2)\b/
    };
    const padrao = regras[id] || new RegExp(`\\b${id}\\b`, 'i');
    return nomes.some(n => padrao.test(n));
  }, [arquivos]);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase();
    return items.filter(i => 
      i.descricao_de_condicionante?.toLowerCase().includes(t) || 
      i.codigo?.toString().includes(t)
    );
  }, [items, busca]);

  // 4. EXPORTAÇÕES (PDF, EXCEL, WORD)
  const exportar = async (tipo) => {
    if (tipo === 'XLSX') {
      const ws = XLSX.utils.json_to_sheet(items.map(i => ({ Cód: i.codigo, Status: validar(i.codigo)?'OK':'Pendente' })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
      XLSX.writeFile(wb, "Maximus_Auditoria.xlsx");
    } else if (tipo === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("MAXIMUS PhD - RELATÓRIO TÉCNICO", 14, 20);
      doc.autoTable({
        startY: 30,
        head: [['CÓDIGO', 'DESCRIÇÃO', 'RESULTADO']],
        body: items.map(it => [it.codigo, it.descricao_de_condicionante?.slice(0,70), validar(it.codigo)?'CONFORME':'PENDENTE']),
        headStyles: { fillStyle: [0, 0, 0], textColor: [0, 255, 0] }
      });
      if (!sigPad.current.isEmpty()) {
        doc.addImage(sigPad.current.toDataURL(), 'PNG', 15, doc.lastAutoTable.finalY + 10, 50, 20);
        doc.text("Assinado Digitalmente", 15, doc.lastAutoTable.finalY + 35);
      }
      doc.save("Relatorio_Auditoria.pdf");
    }
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    setArquivos(prev => [...prev, ...files.map(f => ({ nome: f.name.toUpperCase(), data: new Date().toLocaleDateString() }))]);
  };

  if (loading) return <div style={s.load}><RefreshCw className="animate-spin" size={40}/></div>;

  return (
    <div style={s.body} onDragOver={e=>e.preventDefault()} onDrop={handleUpload}>
      <aside style={s.side}>
        <div style={s.logo}>
          <Shield color="#0f0" size={28}/> 
          <div>MAXIMUS <span style={s.v}>PhD v46</span></div>
        </div>
        
        <div style={isOnline ? s.on : s.off}>
          {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>} {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><HardHat size={18}/> Auditoria</button>
          <button onClick={()=>setAba('FROTA')} style={aba==='FROTA'?s.btnA:s.btn}><Truck size={18}/> Frota / CIPP</button>
          <button onClick={()=>setAba('CERT')} style={aba==='CERT'?s.btnA:s.btn}><PenTool size={18}/> Assinatura & Gov</button>
        </nav>

        <div style={s.boxArq}>
          <div style={s.boxHead}>EVIDÊNCIAS ({arquivos.length}) <Trash2 size={12} onClick={()=>setArquivos([])} style={{cursor:'pointer'}}/></div>
          <div style={s.boxLista}>
            {arquivos.map((a,i)=>(<div key={i} style={s.itemArq}><CheckCircle size={10} color="#0f0"/> {a.nome.slice(0,22)}</div>))}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.head}>
          <div style={s.search}><Search size={18} color="#444"/><input placeholder="Pesquisar nos 424 registros..." style={s.input} value={busca} onChange={e=>setBusca(e.target.value)}/></div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>exportar('PDF')} style={s.btnSec}><Download size={18}/> PDF</button>
            <button onClick={()=>exportar('XLSX')} style={s.btnSec}>XLSX</button>
            <label style={s.btnUp}><FilePlus size={18}/> UPLOAD <input type="file" multiple hidden onChange={handleUpload}/></label>
          </div>
        </header>

        <div style={s.content}>
          {aba === 'AUDITORIA' && (
            <div style={s.scroll}>
              <table style={s.table}>
                <thead><tr style={s.th}><th>CÓD</th><th>REQUISITO</th><th style={{textAlign:'center'}}>STATUS</th></tr></thead>
                <tbody>
                  {filtrados.map((it,i)=>(
                    <tr key={i} style={s.tr}>
                      <td style={s.tdC}>{it.codigo}</td>
                      <td style={s.tdD}>{it.descricao_de_condicionante}</td>
                      <td style={{textAlign:'center'}}><Camera color={validar(it.codigo)?'#0f0':'#111'} size={24}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'CERT' && (
            <div style={{padding:40}}>
              <div style={s.govCard}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/bb/Logotipo_do_Governo_do_Brasil_2023.png" height="30" alt="gov.br" />
                  <span style={s.badge}>Autenticação Prata/Ouro</span>
                </div>
                <p style={{fontSize:12, color:'#999', marginTop:10}}>Conecte sua conta Gov.br para assinatura com validade jurídica (ICP-Brasil).</p>
                <button style={s.btnGov}>ASSINAR COM GOV.BR</button>
              </div>

              <div style={{marginTop:30, textAlign:'center'}}>
                <h4 style={{marginBottom:15, fontSize:14, color:'#444'}}>Assinatura Manual do Auditor</h4>
                <div style={s.sigBox}>
                  <SignatureCanvas ref={sigPad} penColor='#0f0' canvasProps={{width: 600, height: 200, className: 'sigCanvas'}} />
                </div>
                <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:15}}>
                  <button onClick={()=>sigPad.current.clear()} style={s.btnLimpar}>Limpar</button>
                  <button style={s.btnConfirm}>Validar Certificado</button>
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
  body: { display: 'flex', height: '100vh', background: '#000', color: '#eee', fontFamily: 'sans-serif', overflow: 'hidden' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0' },
  side: { width: '300px', background: '#050505', borderRight: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', gap: 12, alignItems: 'center' },
  v: { fontSize: '10px', background: '#0f0', color: '#000', padding: '2px 6px', borderRadius: '4px' },
  on: { fontSize: '10px', color: '#0f0', display: 'flex', gap: 5, marginBottom: 20, alignItems: 'center', background: '#002200', padding: '5px 10px', borderRadius: '20px', width: 'fit-content' },
  off: { fontSize: '10px', color: '#f00', display: 'flex', gap: 5, marginBottom: 20, alignItems: 'center', background: '#220000', padding: '5px 10px', borderRadius: '20px', width: 'fit-content' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  btn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', textAlign: 'left', borderRadius: '12px' },
  btnA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#0a0a0a', border: '1px solid #0f0', color: '#0f0', borderRadius: '12px' },
  boxArq: { flex: 1, marginTop: 20, background: '#020202', borderRadius: '20px', border: '1px solid #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  boxHead: { padding: '12px', fontSize: '10px', color: '#333', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  boxLista: { padding: '12px', overflowY: 'auto' },
  itemArq: { fontSize: '10px', color: '#666', marginBottom: '8px', display: 'flex', gap: 8 },
  main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', gap: 20 },
  search: { flex: 1, background: '#0a0a0a', border: '1px solid #111', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  input: { background: 'none', border: 'none', color: '#fff', padding: '14px', width: '100%', outline: 'none' },
  btnUp: { background: '#0f0', color: '#000', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: 10 },
  btnSec: { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: 10 },
  content: { background: '#050505', borderRadius: '30px', border: '1px solid #111', flex: 1, overflow: 'hidden' },
  scroll: { overflowY: 'auto', height: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', color: '#333', fontSize: '11px', borderBottom: '1px solid #111' },
  tr: { borderBottom: '1px solid #080808' },
  tdC: { padding: '20px', color: '#0f0', fontWeight: 'bold' },
  tdD: { padding: '20px', color: '#888', fontSize: '14px' },
  govCard: { background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #222' },
  badge: { fontSize: '9px', background: '#0057b7', color: '#fff', padding: '3px 8px', borderRadius: '4px' },
  btnGov: { width: '100%', marginTop: 20, background: '#fff', color: '#0057b7', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  sigBox: { background: '#0a0a0a', border: '2px dashed #222', borderRadius: '15px', display: 'inline-block' },
  btnLimpar: { background: '#1a1a1a', color: '#666', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  btnConfirm: { background: '#0f0', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};
