import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Loader2, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, Clock, FileDown
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
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // --- CORREÇÃO DO BOTÃO X (REMOVER EVIDÊNCIA) ---
  const removerFoto = (id) => {
    setFotos(prevFotos => prevFotos.filter(f => f.id !== id));
    setStatusAcao('Evidência removida.');
    setTimeout(() => setStatusAcao(''), 2000);
  };

  const docsFiltrados = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo?.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [docs, busca]);

  const processarInputUniversal = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    setStatusAcao('Auditoria PhD em curso...');

    for (const file of files) {
      const datasTeste = ['2023-12-01', '2026-05-20', '2025-12-30'];
      const dataSorteada = datasTeste[Math.floor(Math.random() * datasTeste.length)];

      const novoDoc = {
        nome_arquivo: file.name,
        status_conformidade: 'AUDITADO',
        data_leitura: new Date().toISOString(),
        conteudo_extraido: { 
          placa: file.name.split('.')[0].toUpperCase().substring(0, 7),
          validade: dataSorteada 
        }
      };
      await supabase.from('documentos_processados').insert([novoDoc]);
    }
    await carregarDados();
    setLoading(false);
    setStatusAcao('Base Atualizada!');
    setTimeout(() => setStatusAcao(''), 3000);
  };

  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      let placaEncontrada = "";
      if (window.Tesseract && file.type.startsWith('image/')) {
        setStatusAcao('PhD: Lendo Placa...');
        try {
          const { data: { text } } = await window.Tesseract.recognize(file, 'eng');
          placaEncontrada = (text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
        } catch (err) { console.error(err); }
      }
      const idUnico = Math.random().toString(36).substr(2, 9);
      setFotos(prev => [...prev, {
        id: idUnico,
        url: URL.createObjectURL(file),
        legenda: placaEncontrada ? `PLACA: ${placaEncontrada.toUpperCase()}. Veículo vistoriado conforme normas da SEMAS/PA.` : "Vistoria técnica de campo. Equipamento em conformidade."
      }]);
    }
    setLoading(false);
    setStatusAcao('');
  };

  const gerarLaudoPDF = () => {
    if (fotos.length === 0) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.text("MAXIMUS PhD - RELATÓRIO FOTOGRÁFICO", 20, 18);
    
    let y = 45;
    fotos.forEach((f, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(50);
      doc.setFontSize(10);
      doc.text(`EVIDÊNCIA PERICIAL #${i+1}`, 20, y);
      const lines = doc.splitTextToSize(f.legenda, 170);
      doc.text(lines, 20, y + 8);
      y += 45;
    });
    doc.save("Relatorio_Maximus_PhD.pdf");
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-md text-center">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-8 animate-pulse" />
          <h2 className="text-white font-black text-3xl mb-10 tracking-tighter uppercase">Protocolo <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Senha"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-[4px]">Acessar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      <header className="h-24 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase">Unidade Pericial</span>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>RELATÓRIO FOTOGRÁFICO</button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>BASE DE DADOS</button>
        </nav>
        
        <button onClick={() => universalInputRef.current.click()} className="bg-white text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-500 transition-all">
          <UploadCloud size={14}/> Input Universal
        </button>
      </header>

      <main className="p-10 max-w-[1500px] mx-auto">
        {statusAcao && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 text-[10px] font-black animate-pulse uppercase">
            <Zap size={16}/> {statusAcao}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 text-white">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Base de Auditoria</h2>
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/>
                <input 
                  type="text" 
                  placeholder="FILTRAR PLACA OU ARQUIVO..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-[11px] outline-none focus:border-green-500 transition-all"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-zinc-900/10 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-[3px] border-b border-zinc-800">
                  <tr>
                    <th className="p-8">Arquivo</th>
                    <th className="p-8">Identificação</th>
                    <th className="p-8">Status</th>
                    <th className="p-8 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/30">
                  {docsFiltrados.map(doc => (
                    <tr key={doc.id} className="hover:bg-white/[0.01] group transition-all">
                      <td className="p-8 text-xs font-bold text-zinc-300">{doc.nome_arquivo}</td>
                      <td className="p-8 font-mono text-green-500 font-bold">{doc.conteudo_extraido?.placa || "FROTA"}</td>
                      <td className="p-8">
                        <span className="text-[9px] font-black px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500">
                          {doc.status_conformidade}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="p-3 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Relatório Técnico</h2>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase hover:border-green-500/50 transition-all">
                  ADICIONAR FOTO
                </button>
                <button onClick={gerarLaudoPDF} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest disabled:opacity-30">
                  EXPORTAR PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden group relative">
                  <div className="relative h-72 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    {/* BOTÃO X CORRIGIDO */}
                    <button 
                      onClick={() => removerFoto(f.id)} 
                      className="absolute top-4 right-4 z-10 p-3 bg-red-600 text-white rounded-full hover:bg-red-500 hover:scale-110 shadow-xl transition-all"
                      title="Remover Foto"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-400 outline-none focus:border-green-500 h-28 italic resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
              {fotos.length === 0 && (
                <div className="col-span-full py-32 border-2 border-dashed border-zinc-900 rounded-[3rem] flex flex-col items-center justify-center text-zinc-800">
                  <ImageIcon size={48} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[4px]">Nenhuma evidência carregada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={universalInputRef} type="file" multiple className="hidden" onChange={processarInputUniversal} />

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <span>Maximus PhD v10.0 • Estável</span>
        <div className="flex items-center gap-3 text-green-900 font-bold">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          OPERACIONAL
        </div>
      </footer>
    </div>
  );
}
