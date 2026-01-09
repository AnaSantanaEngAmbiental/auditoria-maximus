import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  Database, CheckCircle, AlertTriangle, Lock, FileText, 
  LayoutDashboard, Calendar, FileDown, Camera, Image as ImageIcon, X, Zap, MapPin
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// INFRAESTRUTURA CRÍTICA: Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [fotos, setFotos] = useState([]); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('FOTOGRAFICO'); 
  const [statusOCR, setStatusOCR] = useState('');

  const fileInputRef = useRef(null);
  const fotoInputRef = useRef(null);

  // 1. CARREGAMENTO DOS MOTORES VIA CDN (Evita erro de Build na Vercel)
  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // 2. MOTOR OCR (Leitura de Placas em Fotos)
  const executarOCR = async (file) => {
    if (!window.Tesseract) return "";
    setStatusOCR('Maximus PhD analisando imagem...');
    try {
      const result = await window.Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      const placa = (text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
      setStatusOCR('');
      return placa ? `PLACA IDENTIFICADA: ${placa.toUpperCase()} - ` : "";
    } catch (e) {
      setStatusOCR('');
      return "";
    }
  };

  // 3. GESTÃO DE EVIDÊNCIAS FOTOGRÁFICAS
  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const ocrResult = await executarOCR(file);
      const novaFoto = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        nome: file.name,
        legenda: `${ocrResult}Vistoria técnica realizada conforme normas da SEMAS/PA. Equipamento em conformidade.`
      };
      setFotos(prev => [...prev, novaFoto]);
    }
    setLoading(false);
  };

  const gerarRelatorioPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - UNIDADE DE PERÍCIA", 20, 20);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("SISTEMA DE AUDITORIA AMBIENTAL MARABÁ-PA", 20, 28);

    let y = 55;
    fotos.forEach((f, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`ANEXO FOTOGRÁFICO #${i+1}`, 20, y);
      const splitText = doc.splitTextToSize(f.legenda, 170);
      doc.setFont("helvetica", "italic");
      doc.text(splitText, 20, y + 8);
      y += 50;
    });
    doc.save("Relatorio_Fotografico_Maximus.pdf");
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-8 animate-pulse" />
          <h2 className="text-white font-black text-3xl tracking-tighter mb-10">MAXIMUS <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Chave do Auditor"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all">Acessar Unidade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      
      {/* HEADER INTEGRADO */}
      <header className="h-24 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div>
            <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
            <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase">Auditoria Integrada</span>
          </div>

          <nav className="flex gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
            {[
              { id: 'FOTOGRAFICO', label: 'Relatório Fotográfico', icon: <Camera size={14}/> },
              { id: 'FROTA', label: 'Base de Dados', icon: <Database size={14}/> },
              { id: 'LAUDOS', label: 'Ofícios', icon: <FileDown size={14}/> }
            ].map(aba => (
              <button 
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === aba.id ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}
              >
                {aba.icon} {aba.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex gap-4">
          <button onClick={() => fileInputRef.current.click()} className="bg-white text-black font-black px-6 py-3 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-600 transition-all">
            <UploadCloud size={14}/> Input Universal
          </button>
        </div>
      </header>

      <main className="p-10 max-w-[1500px] mx-auto">
        
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Evidências Periciais</h2>
                <p className="text-[10px] text-green-700 font-bold uppercase tracking-[4px] mt-2 flex items-center gap-2">
                   <Zap size={14}/> OCR de Placas Ativo via Tesseract
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase hover:border-green-500/50 transition-all flex items-center gap-3">
                  <Camera size={18}/> Adicionar Foto
                </button>
                <button onClick={gerarRelatorioPDF} className="bg-green-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-green-400 transition-all shadow-2xl">
                  Exportar PDF
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
                <div key={f.id} className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-green-500/30 transition-all">
                  <div className="relative h-72 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(fotos.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-all">
                      <X size={16}/>
                    </button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-300 outline-none focus:border-green-500 transition-all italic h-32 resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
              <div onClick={() => fotoInputRef.current.click()} className="border-2 border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center py-24 cursor-pointer hover:bg-zinc-900/30 hover:border-green-500/20 transition-all group">
                <ImageIcon size={40} className="text-zinc-800 mb-4 group-hover:text-green-500 transition-all" />
                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[4px]">Nova Foto de Campo</p>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900/10 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                <tr><th className="p-8">Documento</th><th className="p-8">Placa</th><th className="p-8">Status SEMAS</th><th className="p-8 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-green-500/[0.01]">
                    <td className="p-8 text-xs font-bold text-zinc-200">{doc.nome_arquivo}</td>
                    <td className="p-8 font-mono text-green-500">{doc.conteudo_extraido?.placa || "FROTA"}</td>
                    <td className="p-8 text-[10px] uppercase font-black">{doc.status_conformidade}</td>
                    <td className="p-8 text-right"><button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="p-3 hover:text-red-500"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={fileInputRef} type="file" multiple className="hidden" />

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <div className="flex gap-10">
          <span>Maximus PhD v5.5</span>
          <span>Deploy Estável Vercel</span>
        </div>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          SISTEMA PERICIAL PRONTO
        </div>
      </footer>
    </div>
  );
}
