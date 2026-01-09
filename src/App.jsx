import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  Database, CheckCircle, AlertTriangle, Lock, FileText, 
  LayoutDashboard, Calendar, FileDown, Camera, Image as ImageIcon, X, Zap
} from 'lucide-react';

// SUPABASE - Conexão Direta
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [fotos, setFotos] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('FOTOGRAFICO'); 
  const [statusOCR, setStatusOCR] = useState('');

  const fotoInputRef = useRef(null);

  // 1. CARREGAMENTO DOS MOTORES VIA CDN (Garante Build Verde na Vercel)
  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.async = false; // Carregar em ordem
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // 2. MOTOR OCR (Leitura de Placas)
  const executarOCR = async (file) => {
    if (!window.Tesseract) return "";
    setStatusOCR('Maximus PhD: Analisando imagem via OCR...');
    try {
      const result = await window.Tesseract.recognize(file, 'eng');
      const placa = (result.data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
      setStatusOCR('');
      return placa ? `PLACA: ${placa.toUpperCase()} - ` : "";
    } catch (e) {
      setStatusOCR('');
      return "";
    }
  };

  // 3. GESTÃO DE RELATÓRIO FOTOGRÁFICO
  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const ocrResult = await executarOCR(file);
      const novaFoto = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        nome: file.name,
        legenda: `${ocrResult}Conformidade técnica verificada. Evidência registrada para laudo pericial.`
      };
      setFotos(prev => [...prev, novaFoto]);
    }
    setLoading(false);
  };

  const gerarRelatorioPDF = () => {
    if (!window.jspdf) {
      alert("Aguarde o carregamento do motor de PDF...");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - RELATÓRIO FOTOGRÁFICO", 20, 18);
    
    let y = 45;
    fotos.forEach((f, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`REGISTRO #${i+1}: ${f.nome}`, 20, y);
      const splitText = doc.splitTextToSize(f.legenda, 170);
      doc.setFont("helvetica", "italic");
      doc.text(splitText, 20, y + 7);
      y += 40;
    });
    doc.save("Relatorio_Pericial.pdf");
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-md text-center">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-8" />
          <h2 className="text-white font-black text-3xl mb-10 tracking-tighter uppercase">Unidade <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Senha do Auditor"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all">Desbloquear</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      <header className="h-24 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase italic">Unidade de Perícia</span>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-900">
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black' : 'text-zinc-600'}`}>FÁBRICA FOTOGRÁFICA</button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black' : 'text-zinc-600'}`}>BASE DE DADOS</button>
        </nav>
        
        <div className="w-20"></div>
      </header>

      <main className="p-10 max-w-[1400px] mx-auto">
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Relatório de Campo</h2>
                <p className="text-[10px] text-green-700 font-bold uppercase tracking-[4px] mt-2 flex items-center gap-2">
                   <Zap size={14}/> OCR de Imagem Ativo
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase flex items-center gap-3">
                  <Camera size={18}/> {loading ? "Processando..." : "Subir Fotos"}
                </button>
                <button onClick={gerarRelatorioPDF} className="bg-green-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl">
                  Gerar Laudo PDF
                </button>
              </div>
            </div>

            {statusOCR && (
              <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 text-[10px] font-black animate-pulse uppercase tracking-[2px]">
                <Loader2 className="animate-spin" size={16}/> {statusOCR}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                  <div className="relative h-64 bg-black">
                    <img src={f.url} className="w-full h-full object-cover" />
                    <button onClick={() => setFotos(fotos.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-500"><X size={16}/></button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-300 outline-none focus:border-green-500 h-24 italic"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <span>Maximus PhD v6.0 • Build Blindado</span>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          AMBIENTE PRONTO
        </div>
      </footer>
    </div>
  );
}
