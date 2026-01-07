import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, ShieldCheck, Database, CheckCircle2, 
  AlertCircle, FileText, Loader2, Search, Zap, LayoutDashboard 
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

  // MOTOR DE EXTRAÇÃO DE PLACAS (BRASIL E MERCOSUL)
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
      const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
      if (data) setDocs(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Analisando: ${file.name}` }, ...prev]);
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
        } else if (['xlsx', 'xls'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          text = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        }

        const info = extrairDados(text);
        await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { placa: info.placa.toUpperCase(), chassi: info.chassi.toUpperCase() },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        setLogs(prev => [{ status: 'success', msg: `Auditado: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro no processamento` }, ...prev]);
      }
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans p-4 lg:p-10">
      <div className="max-w-[1920px] mx-auto space-y-8">
        
        {/* HEADER TOP-TIER */}
        <header className="flex items-center justify-between bg-zinc-900/10 p-8 rounded-[3rem] border border-zinc-800/40">
          <div className="flex items-center gap-6">
            <div className="bg-green-500/10 p-5 rounded-[2rem] border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
              <ShieldCheck className="text-green-500" size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Maximus PhD</h1>
              <p className="text-[11px] tracking-[6px] text-zinc-600 font-bold uppercase">Sistema de Inteligência de Frota</p>
            </div>
          </div>
          <div className="flex gap-8 items-center">
             <div className="hidden xl:flex flex-col text-right">
                <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Auditoria em Tempo Real</span>
                <span className="text-xs text-green-500 font-mono font-bold uppercase">Status: Operacional</span>
             </div>
             <LayoutDashboard className="text-zinc-800" size={30} />
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          
          {/* PAINEL DE COMANDO (3 COLUNAS) */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <div 
              onClick={() => document.getElementById('fIn').click()}
              className="bg-green-500/5 border-2 border-dashed border-green-500/10 p-16 rounded-[3.5rem] text-center hover:bg-green-500/10 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-6 text-green-500/30 group-hover:scale-110 group-hover:text-green-500 transition-all" size={60} />
              <p className="text-sm font-black text-white uppercase tracking-widest">Carregar Ofício</p>
              <p className="text-[10px] text-zinc-600 mt-2 uppercase">PDF, Excel ou Word</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-black/40 border border-zinc-900/50 rounded-[3rem] p-8 h-[500px] flex flex-col">
              <h3 className="text-[11px] font-black text-zinc-700 mb-6 tracking-[4px] uppercase border-b border-zinc-900 pb-4">Console Maximus</h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs p-4 bg-zinc-900/20 rounded-2xl border border-zinc-800/40 flex gap-4 items-center animate-in fade-in">
                    {log.status === 'success' ? <CheckCircle2 size={16} className="text-green-500" /> : <Loader2 size={16} className="text-yellow-500 animate-spin" />}
                    <span className="text-zinc-500">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL DE DADOS (9 COLUNAS) */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/5 border border-zinc-800/60 rounded-[4rem] p-10 min-h-[800px]">
              <div className="flex items-center justify-between mb-10 px-6">
                <div className="flex items-center gap-4">
                  <Database size={24} className="text-green-500" />
                  <h2 className="text-lg font-black text-white uppercase tracking-[2px]">Histórico de Auditoria</h2>
                </div>
                <div className="bg-zinc-900/50 px-5 py-2 rounded-full border border-zinc-800 text-[11px] font-bold text-zinc-500">
                  {docs.length} DOCUMENTOS NA BASE
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950/40 border border-zinc-900/30 p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-zinc-900/30 hover:border-green-500/20 transition-all group">
                    <div className="flex items-center gap-8 flex-1">
                      <div className="bg-zinc-900 p-5 rounded-3xl text-zinc-700 group-hover:text-green-500 transition-colors">
                        <FileText size={28} />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-zinc-200 uppercase italic group-hover:text-white transition-colors">{doc.nome_arquivo}</h4>
                        <div className="flex gap-4 mt-2">
                           <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter bg-black/40 px-3 py-1 rounded-lg border border-zinc-900">
                             LIDO EM: {new Date(doc.data_leitura).toLocaleString()}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* PLACA COM DESTAQUE MAXIMUS */}
                      <div className="bg-black/60 px-8 py-4 rounded-3xl border border-zinc-800 group-hover:border-green-500/30 transition-all text-center">
                        <span className="text-[9px] text-zinc-700 font-black uppercase tracking-[3px] block mb-1">Identificação</span>
                        <span className="text-xl font-black text-green-500 font-mono tracking-[4px] italic">
                          {doc.conteudo_extraido?.placa || "N/A"}
                        </span>
                      </div>
                      
                      {/* CHASSI BOX */}
                      <div className="bg-black/60 px-8 py-4 rounded-3xl border border-zinc-800 hidden xl:block text-center">
                        <span className="text-[9px] text-zinc-700 font-black uppercase tracking-[3px] block mb-1">Chassi</span>
                        <span className="text-[12px] font-bold text-zinc-500 font-mono uppercase">
                          {doc.conteudo_extraido?.chassi || "N/A"}
                        </span>
                      </div>

                      <div className="bg-green-500 p-3 rounded-2xl hidden md:block opacity-0 group-hover:opacity-100 transition-all">
                        <CheckCircle2 size={20} className="text-black" />
                      </div>
                    </div>
                  </div>
                ))}

                {docs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-60 opacity-10">
                    <Search size={100} strokeWidth={1} />
                    <p className="mt-6 text-xl font-black uppercase tracking-[10px]">Aguardando Dados</p>
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
