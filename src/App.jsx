import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Loader2, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, FileDown, RefreshCcw, Smartphone
} from 'lucide-react';

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
  const [statusAcao, setStatusAcao] = useState('');

  const fotoInputRef = useRef(null);
  const universalInputRef = useRef(null);

  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    scripts.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      document.head.appendChild(s);
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // --- AÇÃO: ZERAR UNIDADE (LIMPEZA TOTAL) ---
  const zerarUnidade = async () => {
    if (window.confirm("ALERTA MÁXIMO: Deseja apagar TODOS os dados da Base de Auditoria? Isso não pode ser desfeito.")) {
      setLoading(true);
      const { error } = await supabase.from('documentos_processados').delete().neq('id', 0); // Deleta todos
      if (!error) {
        setDocs([]);
        setStatusAcao('UNIDADE REINICIADA / BASE ZERADA');
      }
      setLoading(false);
      setTimeout(() => setStatusAcao(''), 3000);
    }
  };

  const removerFoto = (id) => {
    setFotos(prev => prev.filter(f => f.id !== id));
    setStatusAcao('Evidência descartada.');
    setTimeout(() => setStatusAcao(''), 2000);
  };

  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Converte para Base64 para o PDF
      reader.onload = async () => {
        let placa = "";
        if (window.Tesseract) {
          setStatusAcao('PhD: Escaneando...');
          const { data } = await window.Tesseract.recognize(file, 'eng');
          placa = (data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
        }
        setFotos(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result, // Base64
          legenda: placa ? `PLACA: ${placa.toUpperCase()}. Veículo auditado.` : "Registro técnico de conformidade ambiental."
        }]);
      };
    }
    setLoading(false);
    setStatusAcao('');
  };

  const gerarLaudoPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header PhD
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("MAXIMUS PhD - RELATÓRIO TÉCNICO PERICIAL", 15, 20);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`DATA: ${new Date().toLocaleString()} - UNIDADE MARABÁ/PA`, 15, 28);

    let y = 50;
    fotos.forEach((f, i) => {
      if (y > 220) { doc.addPage(); y = 20; }
      
      // Insere a Imagem no PDF
      try {
        doc.addImage(f.url, 'JPEG', 15, y, 50, 35);
      } catch (e) { doc.text("[Erro na imagem]", 15, y); }

      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`EVIDÊNCIA #${i+1}`, 70, y + 5);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(f.legenda, 120);
      doc.text(lines, 70, y + 12);
      
      y += 50;
    });

    doc.save(`LAUDO_PhD_${Date.now()}.pdf`);
  };

  const docsFiltrados = useMemo(() => {
    return docs.filter(d => d.nome_arquivo?.toLowerCase().includes(busca.toLowerCase()) || d.conteudo_extraido?.placa?.toLowerCase().includes(busca.toLowerCase()));
  }, [docs, busca]);

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-md text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-green-500 animate-pulse" />
          </div>
          <h2 className="text-white font-black text-2xl mb-8 tracking-tighter uppercase">MAXIMUS <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Chave de Acesso"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-4 outline-none focus:border-green-500 transition-all"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-[4px] hover:bg-green-500 transition-all">Iniciar Unidade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans selection:bg-green-500 selection:text-black">
      {/* HEADER MOBILE & DESKTOP */}
      <header className="h-24 bg-black/80 backdrop-blur-xl border-b border-zinc-900 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
            <span className="text-[7px] text-zinc-700 font-bold tracking-[3px] uppercase">Cross-Platform v11</span>
          </div>
          <Smartphone size={20} className="text-zinc-800 md:hidden" />
        </div>

        <nav className="flex gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-900">
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>FÁBRICA</button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`px-4 md:px-8 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>BASE</button>
        </nav>
        
        <div className="flex gap-2">
           <button onClick={() => universalInputRef.current.click()} className="bg-zinc-900 p-3 rounded-xl text-white hover:bg-green-600 transition-all"><UploadCloud size={18}/></button>
        </div>
      </header>

      <main className="p-4 md:p-10 max-w-[1400px] mx-auto pb-32">
        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-2xl animate-bounce">
            {statusAcao}
          </div>
        )}

        {/* ABA BASE DE DADOS */}
        {abaAtiva === 'FROTA' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Auditoria de Dados</h2>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14}/>
                  <input 
                    type="text" placeholder="BUSCAR PLACA..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-[10px] text-white outline-none focus:border-green-500"
                    value={busca} onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <button onClick={zerarUnidade} className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Zerar Unidade">
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 rounded-[2rem] overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                  <tr>
                    <th className="p-6">Arquivo</th>
                    <th className="p-6">Placa</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {docsFiltrados.map(doc => (
                    <tr key={doc.id} className="hover:bg-green-500/[0.02] group">
                      <td className="p-6 text-[11px] font-bold text-zinc-300">{doc.nome_arquivo}</td>
                      <td className="p-6 font-mono text-green-500 text-xs">{doc.conteudo_extraido?.placa || "N/A"}</td>
                      <td className="p-6"><span className="text-[8px] font-black px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800">OK</span></td>
                      <td className="p-6 text-right">
                        <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA FÁBRICA FOTOGRÁFICA */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Laudos</h2>
              <div className="flex gap-2">
                <button onClick={() => fotoInputRef.current.click()} className="bg-white text-black font-black px-6 py-3 rounded-xl text-[9px] uppercase hover:bg-green-500 transition-all flex items-center gap-2">
                   <Camera size={14}/> FOTO
                </button>
                <button onClick={gerarLaudoPDF} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-6 py-3 rounded-xl text-[9px] uppercase disabled:opacity-20 shadow-lg shadow-green-500/20">
                   PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] overflow-hidden group relative">
                  <div className="relative h-60 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => removerFoto(f.id)} className="absolute top-4 right-4 p-2.5 bg-red-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all"><X size={16} strokeWidth={3}/></button>
                  </div>
                  <div className="p-5">
                    <textarea 
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-[11px] text-zinc-400 outline-none focus:border-green-500 h-24 italic resize-none"
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

      {/* FOOTER PERSISTENTE */}
      <footer className="fixed bottom-0 w-full h-16 bg-black/90 backdrop-blur-md border-t border-zinc-900 flex items-center px-6 justify-between text-[7px] font-black text-zinc-700 uppercase tracking-[2px] z-[100]">
        <div className="flex flex-col">
          <span>MAXIMUS PhD © 2026</span>
          <span className="text-green-900">MARABÁ • PARÁ • BRAZIL</span>
        </div>
        <div className="flex items-center gap-2 text-green-500">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
          SISTEMA PERICIAL ATIVO
        </div>
      </footer>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={universalInputRef} type="file" multiple className="hidden" onChange={processarInputUniversal} />
    </div>
  );
}
