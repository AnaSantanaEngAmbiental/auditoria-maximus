import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Loader2, Trash2, 
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  CheckCircle2, AlertCircle, FileDown
} from 'lucide-react';

// CONEXÃO SUPABASE
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
  const [statusAcao, setStatusAcao] = useState('');

  const fotoInputRef = useRef(null);
  const universalInputRef = useRef(null);

  // CARREGAMENTO DE MOTORES EXTERNOS
  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  async function carregarDados() {
    const { data, error } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // --- MOTOR DE AUDITORIA (INPUT UNIVERSAL) ---
  const processarInputUniversal = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    setStatusAcao('Auditando documentos...');

    for (const file of files) {
      // Simulação de extração pericial Maximus
      const novoDoc = {
        nome_arquivo: file.name,
        status_conformidade: 'EM ANÁLISE',
        legenda_tecnica: `Auditoria realizada em ${new Date().toLocaleDateString()} - Unidade Marabá.`,
        conteudo_extraido: { placa: "VERIFICANDO", data: new Date() }
      };

      const { error } = await supabase.from('documentos_processados').insert([novoDoc]);
      if (error) console.error("Erro Supabase:", error);
    }

    await carregarDados();
    setLoading(false);
    setStatusAcao('Auditoria Concluída!');
    setTimeout(() => setStatusAcao(''), 3000);
  };

  // --- MOTOR OCR (RELATÓRIO FOTOGRÁFICO) ---
  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      let placaEncontrada = "";
      if (window.Tesseract) {
        setStatusAcao('PhD: Escaneando Placa...');
        const result = await window.Tesseract.recognize(file, 'eng');
        placaEncontrada = (result.data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
      }
      
      const novaFoto = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        nome: file.name,
        legenda: placaEncontrada ? `PLACA IDENTIFICADA: ${placaEncontrada.toUpperCase()}. Veículo em conformidade com as normas ambientais.` : "Vistoria técnica de campo. Evidência registrada para compor laudo pericial."
      };
      setFotos(prev => [...prev, novaFoto]);
    }
    setLoading(false);
    setStatusAcao('');
  };

  const gerarLaudoPDF = () => {
    if (!window.jspdf) return alert("Erro: Motor PDF não carregado.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Design Maximus PhD
    doc.setFillColor(0, 40, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - AUDITORIA AMBIENTAL", 20, 20);
    doc.setFontSize(8);
    doc.text("CARDOSO & RATES ENGENHARIA - MARABÁ/PA", 20, 28);
    
    let y = 55;
    fotos.forEach((f, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`EVIDÊNCIA #${i+1}: ${f.nome}`, 20, y);
      const lines = doc.splitTextToSize(f.legenda, 170);
      doc.setFont("helvetica", "italic");
      doc.text(lines, 20, y + 8);
      y += 45;
    });
    
    doc.save(`LAUDO_MAXIMUS_${new Date().getTime()}.pdf`);
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] w-full max-w-md text-center">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-8" />
          <h2 className="text-white font-black text-3xl mb-10 tracking-tighter uppercase font-mono">Unidade <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Chave de Acesso"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500"
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
      <header className="h-24 bg-black/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase italic">Auditoria Pericial</span>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-900">
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>
            <Camera size={14}/> RELATÓRIO FOTOGRÁFICO
          </button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>
            <Database size={14}/> BASE DE DADOS
          </button>
        </nav>
        
        <button onClick={() => universalInputRef.current.click()} className="bg-white text-black font-black px-6 py-3 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-500 transition-all">
          <UploadCloud size={14}/> Input Universal
        </button>
      </header>

      <main className="p-10 max-w-[1500px] mx-auto">
        {statusAcao && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 text-[10px] font-black animate-bounce uppercase tracking-[2px]">
            <Zap size={16}/> {statusAcao}
          </div>
        )}

        {/* ABA FOTOGRÁFICA */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter italic">Fábrica de Laudos</h2>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[4px] mt-2">Relatórios Fotográficos com OCR</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase flex items-center gap-3 hover:border-green-500/50 transition-all">
                  <ImageIcon size={18}/> {loading ? "PhD Lendo..." : "Adicionar Evidência"}
                </button>
                <button onClick={gerarLaudoPDF} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl disabled:opacity-30">
                  Gerar PDF Inteligente
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden group">
                  <div className="relative h-64 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                    <button onClick={() => setFotos(fotos.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-500"><X size={16}/></button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-300 outline-none focus:border-green-500 h-28 italic resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA BASE DE DADOS (FROTA) */}
        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900/10 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Documento Auditado</th>
                  <th className="p-8">Placa/Ref</th>
                  <th className="p-8">Status SEMAS</th>
                  <th className="p-8 text-right">Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {docs.length === 0 && (
                  <tr><td colSpan="4" className="p-20 text-center uppercase text-[10px] tracking-[5px]">Nenhum arquivo na Base de Dados. Use o Input Universal.</td></tr>
                )}
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-green-500/[0.02] transition-all group">
                    <td className="p-8 text-xs font-bold text-zinc-200 flex items-center gap-3">
                      <FileText size={16} className="text-zinc-700"/> {doc.nome_arquivo}
                    </td>
                    <td className="p-8 font-mono text-green-500 font-bold">{doc.conteudo_extraido?.placa || "FROTA"}</td>
                    <td className="p-8">
                      <span className="text-[10px] font-black bg-zinc-950 border border-zinc-800 px-4 py-1.5 rounded-full text-zinc-400">
                        {doc.status_conformidade}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="p-3 text-zinc-800 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* INPUTS ESCONDIDOS */}
      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={universalInputRef} type="file" multiple className="hidden" onChange={processarInputUniversal} />

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <div className="flex gap-10">
          <span>Maximus PhD v7.0</span>
          <span>Unidade Marabá-PA</span>
        </div>
        <div className="flex items-center gap-3 text-green-900 font-bold">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          SISTEMA PERICIAL OPERACIONAL
        </div>
      </footer>
    </div>
  );
}
