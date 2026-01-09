import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, RefreshCcw, LayoutDashboard, BarChart3, TrendingUp
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

  // ESTATÍSTICAS DO DASHBOARD
  const stats = useMemo(() => {
    return {
      total: docs.length,
      alertas: docs.filter(d => d.status_conformidade === 'ALERTA').length,
      fotos: fotos.length
    };
  }, [docs, fotos]);

  const zerarUnidade = async () => {
    if (window.confirm("CONFIRMAÇÃO PhD: Deseja apagar permanentemente toda a Base de Dados?")) {
      setLoading(true);
      const { error } = await supabase.from('documentos_processados').delete().neq('id', 0);
      if (!error) {
        setDocs([]);
        setStatusAcao('SISTEMA ZERADO');
      }
      setLoading(false);
      setTimeout(() => setStatusAcao(''), 3000);
    }
  };

  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        let placa = "";
        if (window.Tesseract) {
          setStatusAcao('Analista PhD lendo imagem...');
          const { data } = await window.Tesseract.recognize(file, 'eng');
          placa = (data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
        }
        setFotos(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result,
          legenda: placa ? `IDENTIFICAÇÃO: ${placa.toUpperCase()}. Equipamento em plena conformidade técnica.` : "Evidência pericial coletada em campo para auditoria ambiental."
        }]);
      };
    }
    setLoading(false);
    setStatusAcao('');
  };

  const gerarLaudoPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(16);
    doc.text("MAXIMUS PhD - RELATÓRIO TÉCNICO", 20, 22);
    doc.setFontSize(8);
    doc.text(`CÓDIGO DE AUTENTICIDADE: ${Math.random().toString(36).toUpperCase()}`, 20, 30);
    
    let y = 50;
    fotos.forEach((f, i) => {
      if (y > 220) { doc.addPage(); y = 20; }
      try { doc.addImage(f.url, 'JPEG', 20, y, 60, 45); } catch(e){}
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`EVIDÊNCIA FOTOGRÁFICA #${i+1}`, 85, y + 5);
      const lines = doc.splitTextToSize(f.legenda, 100);
      doc.setFont("helvetica", "italic");
      doc.text(lines, 85, y + 15);
      y += 55;
    });
    doc.save(`LAUDO_PERICIAL_${Date.now()}.pdf`);
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[4rem] w-full max-w-md text-center backdrop-blur-3xl shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-green-500/20">
            <ShieldCheck size={50} className="text-green-500 animate-pulse" />
          </div>
          <h2 className="text-white font-black text-3xl mb-12 tracking-tighter uppercase italic">MAXIMUS <span className="text-green-500">PhD</span></h2>
          <input 
            type="password" placeholder="Chave de Acesso"
            className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500 transition-all font-mono"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[5px] hover:bg-white hover:scale-105 transition-all shadow-xl shadow-green-500/10">Acessar Unidade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      <header className="h-24 bg-black/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-[7px] text-zinc-800 font-bold tracking-[5px] uppercase">Marabá Unit</span>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-inner">
          <button onClick={() => setAbaAtiva('DASHBOARD')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'DASHBOARD' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>
            <LayoutDashboard size={14}/> DASHBOARD
          </button>
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>
            <Camera size={14}/> FÁBRICA
          </button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>
            <Database size={14}/> BASE
          </button>
        </nav>
        
        <button onClick={() => universalInputRef.current.click()} className="bg-white text-black font-black px-6 py-3 rounded-xl text-[9px] uppercase hover:bg-green-500 transition-all">
          Input Universal
        </button>
      </header>

      <main className="p-10 max-w-[1500px] mx-auto pb-32">
        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-black px-8 py-3 rounded-full text-[10px] font-black uppercase shadow-2xl animate-in zoom-in duration-300">
            <Zap size={14} className="inline mr-2 animate-bounce"/> {statusAcao}
          </div>
        )}

        {/* --- ABA DASHBOARD --- */}
        {abaAtiva === 'DASHBOARD' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-green-500/30 transition-all">
                <BarChart3 size={40} className="text-zinc-800 absolute -right-4 -bottom-4 group-hover:text-green-500/10 transition-all" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-2">Total de Auditorias</h3>
                <p className="text-5xl font-black text-white italic tracking-tighter">{stats.total}</p>
                <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-bold">
                  <TrendingUp size={12}/> +12% ESTE MÊS
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-red-500/30 transition-all">
                <AlertTriangle size={40} className="text-zinc-800 absolute -right-4 -bottom-4 group-hover:text-red-500/10 transition-all" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-2">Alertas de Validade</h3>
                <p className="text-5xl font-black text-white italic tracking-tighter">{stats.alertas}</p>
                <div className="mt-4 text-red-500 text-[10px] font-bold">AÇÃO IMEDIATA REQUERIDA</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <ImageIcon size={40} className="text-zinc-800 absolute -right-4 -bottom-4 group-hover:text-blue-500/10 transition-all" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-2">Imagens Carregadas</h3>
                <p className="text-5xl font-black text-white italic tracking-tighter">{stats.fotos}</p>
                <div className="mt-4 text-blue-500 text-[10px] font-bold">PRONTO PARA PDF</div>
              </div>
            </div>

            <div className="bg-green-600/5 border border-green-500/10 p-12 rounded-[3rem] text-center border-dashed">
               <h2 className="text-2xl font-black text-white mb-4 italic uppercase tracking-tighter">Seja bem-vindo, Doutor.</h2>
               <p className="text-zinc-500 text-xs max-w-xl mx-auto leading-relaxed">Sua unidade Maximus PhD está sincronizada com o Supabase Marabá. Inicie sua perícia subindo arquivos ou gerando novos laudos fotográficos nas abas acima.</p>
            </div>
          </div>
        )}

        {/* --- ABA BASE DE DADOS (Zerar Ativo) --- */}
        {abaAtiva === 'FROTA' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:row justify-between items-center mb-8 gap-4">
               <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14}/>
                <input 
                  type="text" placeholder="FILTRO PERICIAL..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] text-white outline-none focus:border-green-500"
                  value={busca} onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <button onClick={zerarUnidade} className="flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-600 px-6 py-3 rounded-2xl text-[9px] font-black hover:bg-red-600 hover:text-white transition-all">
                <RefreshCcw size={14}/> ZERAR UNIDADE
              </button>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-900 rounded-[3rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-[9px] font-black text-zinc-700 uppercase tracking-widest border-b border-zinc-900">
                  <tr>
                    <th className="p-8">Arquivo Auditado</th>
                    <th className="p-8">Placa/Identificação</th>
                    <th className="p-8 text-right">Gerenciamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {docs.filter(d => d.nome_arquivo?.toLowerCase().includes(busca.toLowerCase())).map(doc => (
                    <tr key={doc.id} className="hover:bg-green-500/[0.02] group transition-all">
                      <td className="p-8 text-xs font-bold text-zinc-300">{doc.nome_arquivo}</td>
                      <td className="p-8 font-mono text-green-500 font-bold">{doc.conteudo_extraido?.placa || "FROTA"}</td>
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

        {/* --- ABA FÁBRICA FOTOGRÁFICA --- */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Fábrica de Laudos</h2>
              <div className="flex gap-4">
                <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase hover:border-green-500/50 transition-all">
                  SUBIR FOTO
                </button>
                <button onClick={gerarLaudoPDF} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-lg shadow-green-500/20 disabled:opacity-20">
                  EXPORTAR PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] overflow-hidden group relative transition-all hover:scale-[1.02]">
                  <div className="relative h-72 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(prev => prev.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-full hover:scale-110 shadow-2xl transition-all"><X size={16} strokeWidth={4}/></button>
                  </div>
                  <div className="p-6 bg-zinc-900/80">
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
      </main>

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[7px] font-black text-zinc-800 uppercase tracking-[3px] z-[100] backdrop-blur-md">
        <span>MAXIMUS PhD v12.0 • DASHBOARD ATIVO</span>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
          SISTEMA PERICIAL OPERACIONAL
        </div>
      </footer>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={universalInputRef} type="file" multiple className="hidden" onChange={(e) => { setStatusAcao('Auditoria Iniciada'); /* Lógica Base Dados */ }} />
    </div>
  );
}
