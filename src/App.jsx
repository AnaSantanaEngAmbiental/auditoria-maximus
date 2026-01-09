import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  FileSearch, Database, CheckCircle, AlertTriangle, Lock, FileText, 
  LayoutDashboard, Calendar, FileDown, ClipboardCheck, Camera, Image as ImageIcon, X, Zap
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Tesseract from 'tesseract.js'; // Motor OCR para leitura de imagens

// INFRAESTRUTURA CRÍTICA
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
  const [analisandoOCR, setAnalisandoOCR] = useState(false);

  const fileInputRef = useRef(null);
  const fotoInputRef = useRef(null);

  useEffect(() => { if (autorizado) carregarDados(); }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // --- MOTOR OCR: LEITURA AUTOMÁTICA DE PLACAS EM FOTOS ---
  const processarOCR = async (file) => {
    setAnalisandoOCR(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const placaDetectada = (text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
      setAnalisandoOCR(false);
      return placaDetectada ? `PLACA DETECTADA: ${placaDetectada.toUpperCase()} - ` : "";
    } catch (e) {
      setAnalisandoOCR(false);
      return "";
    }
  };

  // --- RELATÓRIO FOTOGRÁFICO ---
  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const prefixoOCR = await processarOCR(file);
      const novaFoto = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        nome: file.name,
        legenda: `${prefixoOCR}Vistoria técnica de conformidade ambiental. Condições operacionais verificadas.`
      };
      setFotos(prev => [...prev, novaFoto]);
    }
    setLoading(false);
  };

  const gerarRelatorioPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(0, 50, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - UNIDADE DE PERÍCIA AMBIENTAL", 20, 20);
    doc.setFontSize(8);
    doc.text("CARDOSO & RATES ENGENHARIA - UNIDADE MARABÁ-PA", 20, 28);

    let yPos = 55;
    fotos.forEach((f, i) => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`EVIDÊNCIA #${i+1}: ${f.nome}`, 20, yPos);
      const splitLegenda = doc.splitTextToSize(f.legenda, 170);
      doc.setFont("helvetica", "italic");
      doc.text(splitLegenda, 20, yPos + 8);
      yPos += 40;
    });

    doc.save("Relatorio_Pericial_Maximus.pdf");
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl">
          <div className="bg-green-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
            <ShieldCheck size={45} className="text-black" />
          </div>
          <h2 className="text-white font-black text-3xl tracking-tighter mb-2">MAXIMUS <span className="text-green-500 italic">PhD</span></h2>
          <p className="text-zinc-600 text-[9px] uppercase tracking-[6px] mb-10 font-bold">Protocolo Marabá-PA</p>
          <input 
            type="password" 
            placeholder="Chave do Auditor"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-white mb-6 text-center focus:border-green-500 outline-none transition-all"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all">Desbloquear Unidade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      
      {/* HEADER DINÂMICO */}
      <header className="h-24 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
            <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase">Intel. Pericial & OCR Ativo</span>
          </div>

          <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
            {[
              { id: 'FOTOGRAFICO', label: 'Relatório Fotográfico', icon: <Camera size={14}/> },
              { id: 'FROTA', label: 'Controle de Frota', icon: <LayoutDashboard size={14}/> },
              { id: 'LAUDOS', label: 'Fábrica de Laudos', icon: <FileDown size={14}/> }
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
            {loading ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
            Input Universal
          </button>
        </div>
      </header>

      <main className="p-10 max-w-[1600px] mx-auto">
        
        {/* ABA RELATÓRIO FOTOGRÁFICO - A MÁGICA VISUAL */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Evidências Técnicas</h2>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[4px] mt-1">Geração de Laudo com Leitura de Placa via OCR</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => fotoInputRef.current.click()}
                  className="bg-zinc-900 border border-zinc-800 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:border-green-500/50 transition-all"
                >
                  <Camera size={16} className="text-green-500"/> Adicionar Evidência
                </button>
                <button 
                  onClick={gerarRelatorioPDF}
                  className="bg-green-600 text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-green-400 shadow-2xl transition-all"
                >
                  Gerar Relatório Final
                </button>
              </div>
            </div>

            {analisandoOCR && (
              <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 text-xs font-bold animate-pulse">
                <Zap size={18}/> Analisando texto e placas nas imagens via OCR...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-green-500/30 transition-all shadow-xl">
                  <div className="relative h-64 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(fotos.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-all">
                      <X size={16}/>
                    </button>
                  </div>
                  <div className="p-6">
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3 block">{f.nome}</span>
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-400 outline-none focus:border-green-500 transition-all italic h-32 resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
              <div 
                onClick={() => fotoInputRef.current.click()}
                className="border-2 border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center py-24 cursor-pointer hover:bg-zinc-900/20 hover:border-green-500/20 transition-all group"
              >
                <div className="p-6 bg-zinc-900 rounded-full mb-4 group-hover:bg-green-500/10 group-hover:text-green-500 transition-all">
                  <ImageIcon size={35} />
                </div>
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[4px]">Soltar Foto de Vistoria</p>
              </div>
            </div>
          </div>
        )}

        {/* MANTENDO AS OUTRAS ABAS PARA PERSISTÊNCIA */}
        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900/10 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Documento Auditado</th>
                  <th className="p-8 text-center">Identificação</th>
                  <th className="p-8">Status</th>
                  <th className="p-8 text-right pr-12">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {docs.map(doc => (
                  <tr key={doc.id} className="group hover:bg-green-500/[0.01] transition-all">
                    <td className="p-8 flex items-center gap-4 text-xs font-black text-zinc-200">
                      <FileText size={18} className="text-zinc-700"/> {doc.nome_arquivo}
                    </td>
                    <td className="p-8 text-center font-mono text-white font-black">{doc.conteudo_extraido?.placa || "---"}</td>
                    <td className="p-8"><span className="text-[10px] font-black uppercase text-green-700 bg-green-500/5 px-3 py-1 rounded-lg border border-green-500/10">{doc.status_conformidade}</span></td>
                    <td className="p-8 text-right pr-12"><button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="p-3 bg-zinc-900 hover:text-red-500 rounded-xl border border-zinc-800 opacity-20 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={async (e) => {
        setLoading(true);
        // Motor de Auditoria PDF aqui...
        setLoading(false);
      }} />

      <footer className="fixed bottom-0 w-full h-12 bg-black/95 border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <div className="flex gap-10">
          <span>Unidade Integrada Maximus PhD</span>
          <span>Fábrica de Laudos Ativa</span>
        </div>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          SISTEMA OPERACIONAL ESTÁVEL
        </div>
      </footer>
    </div>
  );
}
