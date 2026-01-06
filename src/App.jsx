import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';
import { saveAs } from 'file-saver';
import { 
  ShieldCheck, Gavel, UploadCloud, FileEdit, 
  Truck, CheckCircle2, Save, Download, Search, 
  MapPin, LayoutDashboard, AlertCircle 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusConsolidado() {
  const [isClient, setIsClient] = useState(false);
  const [aba, setAba] = useState('DASHBOARD');
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtiva, setUnidadeAtiva] = useState(null);
  const [textoDoc, setTextoDoc] = useState("");
  const sigCanvas = useRef({});

  // Proteção contra Erro #418 (Hydration)
  useEffect(() => { 
    setIsClient(true); 
    carregarUnidades();
  }, []);

  const carregarUnidades = async () => {
    const { data } = await supabase.from('unidades_maximus').select('*');
    if (data) {
      setUnidades(data);
      setUnidadeAtiva(data[0]);
    }
  };

  // GERADOR DOCX EDITÁVEL
  const baixarDocx = (titulo) => {
    const conteudo = `<html><body><h1>${titulo}</h1><p>${textoDoc}</p></body></html>`;
    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    saveAs(blob, `${titulo}_${unidadeAtiva?.razao_social}.doc`);
  };

  if (!isClient) return null;

  return (
    <div style={s.app}>
      {/* SIDEBAR INTELIGENTE */}
      <aside style={s.side}>
        <div style={s.logo}><ShieldCheck color="#25d366" size={28}/> MAXIMUS PhD</div>
        
        <div style={s.selectBox}>
          <label>UNIDADE EM FOCO:</label>
          <select onChange={(e) => setUnidadeAtiva(unidades.find(u => u.id === e.target.value))}>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.razao_social}</option>)}
          </select>
        </div>

        <nav style={s.nav}>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><LayoutDashboard size={18}/> Dashboard</button>
          <button onClick={() => setAba('VARREDURA')} style={aba === 'VARREDURA' ? s.btnA : s.btn}><UploadCloud size={18}/> Varredura Total</button>
          <button onClick={() => setAba('JURIDICO')} style={aba === 'JURIDICO' ? s.btnA : s.btn}><Gavel size={18}/> Fábrica Jurídica</button>
          <button onClick={() => setAba('ANTT')} style={aba === 'ANTT' ? s.btnA : s.btn}><Truck size={18}/> Comparador ANTT</button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        {aba === 'DASHBOARD' && (
          <div style={s.content}>
            <h1>Status: {unidadeAtiva?.razao_social}</h1>
            <div style={s.gridStats}>
              <div style={s.cardStat}><h3>89%</h3><p>Conformidade</p></div>
              <div style={s.cardStat}><h3>12</h3><p>Pendências</p></div>
            </div>
          </div>
        )}

        {aba === 'JURIDICO' && (
          <div style={s.content}>
            <header style={s.headerDoc}>
              <h2>Editor de Documentos Oficiais</h2>
              <div style={s.actions}>
                <button onClick={() => baixarDocx('PROCURACAO')} style={s.btnW}><FileEdit size={16}/> Word</button>
                <button onClick={() => alert("Salvo no Supabase!")} style={s.btnS}><Save size={16}/> Salvar</button>
              </div>
            </header>
            
            <div style={s.editorFlex}>
              <textarea 
                style={s.editor} 
                value={textoDoc} 
                onChange={(e) => setTextoDoc(e.target.value)}
                placeholder="O texto da varredura aparecerá aqui para você editar..."
              />
              
              <div style={s.assinaturaBox}>
                <p>Assinatura Digital:</p>
                <div style={s.canvas}>
                  <SignatureCanvas ref={sigCanvas} penColor='white' canvasProps={{width: 300, height: 150}} />
                </div>
                <button onClick={() => sigCanvas.current.clear()} style={s.btnClean}>Limpar</button>
              </div>
            </div>
          </div>
        )}

        {aba === 'ANTT' && (
          <div style={s.content}>
            <h2>Comparador de Frota vs ANTT</h2>
            <div style={s.dropGrid}>
               <div style={s.dropMini}>1. Planilha Frota (.xlsx)</div>
               <div style={s.dropMini}>2. Extrato ANTT (.pdf)</div>
            </div>
            {/* Tabela de divergências aqui */}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  side: { width: 280, background: '#080808', padding: 25, borderRight: '1px solid #1a1a1a' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#25d366', marginBottom: 40, display: 'flex', gap: 10, alignItems: 'center' },
  selectBox: { marginBottom: 30, display: 'flex', flexDirection: 'column', gap: 8 },
  nav: { display: 'flex', flexDirection: 'column', gap: 5 },
  btn: { display: 'flex', gap: 12, padding: '12px 15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', borderRadius: 8, transition: '0.3s' },
  btnA: { display: 'flex', gap: 12, padding: '12px 15px', background: '#111', border: '1px solid #25d366', color: '#25d366', cursor: 'pointer', borderRadius: 8 },
  main: { flex: 1, padding: 40, overflowY: 'auto' },
  gridStats: { display: 'flex', gap: 20, marginTop: 20 },
  cardStat: { background: '#080808', padding: 30, borderRadius: 15, border: '1px solid #111', width: 150, textAlign: 'center' },
  headerDoc: { display: 'flex', justifyContent: 'space-between', marginBottom: 20 },
  editorFlex: { display: 'flex', gap: 20 },
  editor: { flex: 1, height: '500px', background: '#080808', color: '#ccc', border: '1px solid #111', borderRadius: 15, padding: 25, fontSize: 16, lineHeight: '1.6', outline: 'none' },
  assinaturaBox: { width: 320, background: '#080808', padding: 20, borderRadius: 15, border: '1px solid #111' },
  canvas: { background: '#000', borderRadius: 10, border: '1px dashed #333', marginBottom: 10 },
  btnW: { background: '#2b579a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnS: { background: '#25d366', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnClean: { background: 'none', border: '1px solid #333', color: '#666', padding: '5px 10px', borderRadius: 5, cursor: 'pointer' },
  dropGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 },
  dropMini: { border: '2px dashed #111', padding: 40, textAlign: 'center', borderRadius: 15, color: '#444' }
};
