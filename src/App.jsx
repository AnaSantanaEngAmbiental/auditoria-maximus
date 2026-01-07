import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, ShieldCheck, Database, CheckCircle2, 
  AlertCircle, FileText, Loader2, Search, Zap 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchDocs();
  }, []);

  // MOTOR DE EXTRAÇÃO PHD
  const extrairDados = (texto) => {
    const placaRegex = /[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi;
    const chassiRegex = /[A-HJ-NPR-Z0-9]{17}/gi;
    return {
      placa: (texto.match(placaRegex) || [])[0] || "---",
      chassi: (texto.match(chassiRegex) || [])[0] || "---"
    };
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false }).limit(20);
      if (data) setDocs(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Lendo: ${file.name}` }, ...prev]);
      try {
        let text = "";
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(" ") + " ";
          }
        }

        const info = extrairDados(text);
        await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { placa: info.placa.toUpperCase(), chassi: info.chassi.toUpperCase() },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        setLogs(prev => [{ status: 'success', msg: `Sucesso: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Falha no processamento` }, ...prev]);
      }
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans p-2 md:p-6 lg:p-10">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* HEADER MINIMALISTA */}
        <header className="flex flex-wrap items-center justify-between bg-zinc-900/20 p-6 rounded-[2.5rem] border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="bg-green-500/10 p-4 rounded-3xl border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <ShieldCheck className="text-green-500" size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Maximus PhD</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] tracking-[4px] text-zinc-600 font-bold uppercase">Auditoria Ativa</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="hidden sm:flex flex-col text-right border-r border-zinc-800 pr-4">
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Supabase Node</span>
                <span className="text-[10px] text-green-500 font-mono">ENCRYPTED_CONNECTED</span>
             </div>
             <Zap className="text-zinc-800" size={24} />
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* LADO ESQUERDO: AÇÕES */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div 
              onClick={() => document.getElementById('fIn').click()}
              className="bg-green-500/5 border-2 border-dashed border-green-500/20 p-12 rounded-[3rem] text-center hover:bg-green-500/10 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <UploadCloud className="mx-auto mb-4 text-green-500/50 group-hover:scale-110 transition-transform relative z-10" size={48} />
              <p className="text-xs font-black text-white uppercase tracking-widest relative z-10">Processar Novo Ofício</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] p-6 h-[450px] flex flex-col shadow-2xl">
              <h3 className="text-[10px] font-black text-zinc-700 mb-6 tracking-[3px] uppercase px-2">Fluxo de Eventos</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {logs.length === 0 && <p className="text-[10px] text-zinc-800 italic text-center py-10">Aguardando entrada...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="text-[10px] p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex gap-4 items-start animate-in slide-in-from-left-2">
                    {log.status === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> : <Loader2 size={14} className="text-yellow-500 animate-spin" />}
                    <span className="text-zinc-400 font-medium">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: DADOS AUDITADOS */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/10 border border-zinc-800 rounded-[3rem] p-8 h-full min-h-[700px] shadow-inner">
              <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-green-500" />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Painel de Resultados</h2>
                </div>
                <button onClick={fetchDocs} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <Loader2 size={16} className={loading ? "animate-spin text-green-500" : "text-zinc-600"} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-black/60 border border-zinc-800/80 p-5 rounded-[2rem] flex items-center justify-between gap-6 hover:border-green-500/40 transition-all group shadow-lg">
                    <div className="flex items-center gap-5 flex-1 min-w-[250px]">
                      <div className="bg-zinc-900 p-4 rounded-2xl text-zinc-700 group-hover:text-green-500 transition-colors shadow-inner">
                        <FileText size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-[13px] font-black text-white truncate uppercase italic tracking-tight">{doc.nome_arquivo}</h4>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase mt-1">Auditado em: {new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* PLACA COM ESTILO DE PLACA */}
                      <div className="bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-800 flex flex-col items-center min-w-[110px] group-hover:border-green-500/20 transition-all">
                        <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-[2px] mb-1">Identificação</span>
                        <span className="text-[14px] font-black text-green-500 font-mono tracking-widest italic">
                          {doc.conteudo_extraido?.placa || "N/A"}
                        </span>
                      </div>
                      
                      {/* CHASSI BOX */}
                      <div className="bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-800 flex flex-col items-center min-w-[160px] hidden sm:flex">
                        <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-[2px] mb-1">Chassi Doc</span>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase truncate w-[130px] text-center">
                          {doc.conteudo_extraido?.chassi || "---"}
                        </span>
                      </div>

                      <div className="h-10 w-px bg-zinc-800 mx-2 hidden md:block"></div>
                      
                      <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hidden md:block group-hover:bg-green-500 group-hover:text-black transition-all cursor-default">
                        OK
                      </div>
                    </div>
                  </div>
                ))}
                {docs.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <Search size={48} />
                    <p className="text-sm italic mt-4 uppercase font-bold">Nenhum dado processado na base</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
