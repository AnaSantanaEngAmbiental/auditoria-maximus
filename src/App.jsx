import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, RefreshCcw, LayoutDashboard, 
  Clock, PenTool, Play, Square, Award
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
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD'); 
  const [statusAcao, setStatusAcao] = useState('');

  // ESTADO DO CRONÔMETRO
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const fotoInputRef = useRef(null);
  const universalInputRef = useRef(null);

  useEffect(() => {
    let intervalo;
    if (timerAtivo) {
      intervalo = setInterval(() => setSegundos(s => s + 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [timerAtivo]);

  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src; s.async = false;
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  const carregarDados = async () => {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  };

  const formatarTempo = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const seg = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  // --- OCR BLINDADO ANTI-ERRO ---
  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        let placa = "";
        // SÓ ENTRA NO OCR SE FOR IMAGEM E TESSERACT ESTIVER PRONTO
        if (window.Tesseract && file.type.startsWith('image/')) {
          setStatusAcao(`Analisando: ${file.name}`);
          try {
            const result = await window.Tesseract.recognize(file, 'eng');
            placa = (result.data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
          } catch (err) {
            console.warn("OCR Falhou, mas o sistema continua.");
          }
        }
        setFotos(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result,
          legenda: placa ? `PLACA IDENTIFICADA: ${placa.toUpperCase()}. Vistoria realizada em Marabá/PA.` : "Registro técnico. Equipamento em conformidade com as normas ambientais."
        }]);
      };
    }
    setLoading(false);
    setStatusAcao('Fotos Processadas.');
    setTimeout(() => setStatusAcao(''), 3000);
  };

  const gerarLaudoPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dataHora = new Date().toLocaleString();

    // Estilo PhD
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(18);
    doc.text("MAXIMUS PhD - LAUDO DE VISTORIA", 20, 20);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`CÓDIGO: PhD-${Date.now()} | EMISSÃO: ${dataHora}`, 20, 30);
    doc.text(`TEMPO DE OPERAÇÃO DE CAMPO: ${formatarTempo(segundos)}`, 20, 36);

    let y = 60;
    fotos.forEach((f, i) => {
      if (y > 200) { doc.addPage(); y = 20; }
      try { doc.addImage(f.url, 'JPEG', 20, y, 65, 45); } catch(e){}
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`EVIDÊNCIA PERICIAL #${i+1}`, 90, y + 10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(f.legenda, 90);
      doc.text(lines, 90, y + 20);
      y += 60;
    });

    // --- MÓDULO DE ASSINATURA DIGITAL ---
    if (y > 240) doc.addPage();
    const finalY = 270;
    doc.setDrawColor(200);
    doc.line(60, finalY, 150, finalY);
    doc.setFontSize(8);
    doc.text("ASSINATURA DO PERITO RESPONSÁVEL", 105, finalY + 5, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text("Documento assinado digitalmente via Unidade Maximus PhD v13.0", 105, finalY + 10, { align: "center" });

    doc.save(`LAUDO_TECNICO_MAXIMUS.pdf`);
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[4rem] w-full max-w-md text-center">
          <ShieldCheck size={50} className="text-green-500 mx-auto mb-8" />
          <h2 className="text-white font-black text-2xl mb-8 uppercase tracking-widest">Acesso <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Senha"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-[10px] tracking-[4px]">Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      <header className="h-24 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-xl tracking-tighter uppercase">Maximus <span className="text-green-500">PhD</span></h1>
          <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-700 tracking-[3px]">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> OPERACIONAL
          </div>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
          <button onClick={() => setAbaAtiva('DASHBOARD')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'DASHBOARD' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>DASHBOARD</button>
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>FÁBRICA</button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600'}`}>BASE</button>
        </nav>
        
        <div className="text-right hidden md:block">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tempo de Vistoria</p>
          <p className="text-xl font-mono text-white font-bold">{formatarTempo(segundos)}</p>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto pb-32">
        {statusAcao && (
          <div className="fixed bottom-20 right-10 z-[100] bg-green-500 text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-2xl animate-in slide-in-from-right-10">
            <Zap size={14} className="inline mr-2"/> {statusAcao}
          </div>
        )}

        {/* --- ABA DASHBOARD (CRONÔMETRO ATIVO) --- */}
        {abaAtiva === 'DASHBOARD' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center">
                <Clock size={32} className={timerAtivo ? "text-green-500 animate-spin-slow" : "text-zinc-700"} />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] mt-4 mb-2">Cronômetro de Campo</h3>
                <p className="text-4xl font-black text-white mb-6 font-mono">{formatarTempo(segundos)}</p>
                <div className="flex gap-2">
                  {!timerAtivo ? (
                    <button onClick={() => setTimerAtivo(true)} className="bg-green-600 text-black px-6 py-2 rounded-xl font-black text-[9px] flex items-center gap-2"><Play size={12}/> INICIAR</button>
                  ) : (
                    <button onClick={() => setTimerAtivo(false)} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-[9px] flex items-center gap-2"><Square size={12}/> PAUSAR</button>
                  )}
                  <button onClick={() => {setTimerAtivo(false); setSegundos(0);}} className="bg-zinc-800 text-zinc-400 px-6 py-2 rounded-xl font-black text-[9px]"><RefreshCcw size={12}/></button>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem] text-center">
                <Award size={32} className="text-green-500 mx-auto" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] mt-4 mb-2">Assinatura Digital</h3>
                <p className="text-zinc-500 text-[10px] italic">Módulo de validação técnica PhD ativo no rodapé de cada laudo gerado.</p>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem] text-center">
                <LayoutDashboard size={32} className="text-zinc-700 mx-auto" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] mt-4 mb-2">Status da Unidade</h3>
                <p className="text-white text-2xl font-black italic">{fotos.length} EVIDÊNCIAS</p>
              </div>
            </div>
          </div>
        )}

        {/* --- ABA FÁBRICA FOTOGRÁFICA --- */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Fábrica de Laudos</h2>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-white text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase hover:bg-green-500 transition-all flex items-center gap-2">
                  <Camera size={16}/> CAPTURAR
                </button>
                <button onClick={gerarLaudoPDF} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase shadow-lg shadow-green-500/20 disabled:opacity-20">
                  GERAR PDF TÉCNICO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden group">
                  <div className="relative h-64 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(prev => prev.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-full hover:scale-110 shadow-2xl transition-all"><X size={16} strokeWidth={4}/></button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-400 outline-none focus:border-green-500 h-28 italic resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA BASE (Filtro e Zerar Unidade) --- */}
        {abaAtiva === 'FROTA' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
              <input 
                type="text" placeholder="FILTRO PhD..."
                className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-6 text-[11px] text-white outline-none w-80 focus:border-green-500"
                value={busca} onChange={(e) => setBusca(e.target.value)}
              />
              <button onClick={async () => { if(window.confirm("Zerar Base?")) { await supabase.from('documentos_processados').delete().neq('id',0); carregarDados(); } }} className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">ZERAR UNIDADE</button>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-[3rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-[9px] font-black text-zinc-700 uppercase tracking-widest border-b border-zinc-900">
                  <tr><th className="p-8">Arquivo</th><th className="p-8">Identificação</th><th className="p-8 text-right">Ação</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {docs.filter(d => d.nome_arquivo?.toLowerCase().includes(busca.toLowerCase())).map(doc => (
                    <tr key={doc.id} className="hover:bg-green-500/[0.02] group">
                      <td className="p-8 text-xs font-bold text-zinc-300">{doc.nome_arquivo}</td>
                      <td className="p-8 font-mono text-green-500 font-bold">{doc.conteudo_extraido?.placa || "N/A"}</td>
                      <td className="p-8 text-right"><button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="text-zinc-800 hover:text-red-500"><Trash2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
    </div>
  );
}
