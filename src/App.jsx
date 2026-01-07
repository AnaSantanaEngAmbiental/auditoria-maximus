import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
// IMPORTAÇÃO CORRIGIDA E REVISADA PELA EQUIPE PHD
import { 
  UploadCloud, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Loader2 // Loader2 substitui o Clock para evitar erros de referência
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    // CDN estável do worker do PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const { data } = await supabase
        .from('documentos_processados')
        .select('*')
        .order('data_leitura', { ascending: false })
        .limit(8);
      if (data) setDocs(data);
    } catch (err) {
      console.error("Erro ao buscar docs:", err);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Processando: ${file.name}` }, ...prev]);
      const ext = file.name.split('.').pop().toLowerCase();
      let text = "";

      try {
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
        } else if (ext === 'docx') {
          const buffer = await file.arrayBuffer();
          const res = await mammoth.extractRawText({ arrayBuffer: buffer });
          text = res.value;
        }

        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { resumo: text.substring(0, 1000) },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        if (error) throw error;
        
        setLogs(prev => [{ status: 'success', msg: `Auditado: ${file.name}` }, ...prev]);
        fetchDocs();

      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Falha: ${file.name} - ${err.message}` }, ...prev]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-4 md:p-10 selection:bg-green-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO PHD */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 border-b border-zinc-900 pb-10">
          <div className="flex items-center gap-5">
            <div className="bg-green-500/10 p-4 rounded-[2rem] border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <ShieldCheck className="text-green-500" size={42} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Maximus PhD</h1>
              <p className="text-[10px] font-bold text-zinc-600 tracking-[5px] uppercase mt-1">Inteligência de Auditoria</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-mono">
                STATUS: <span className="text-green-500">ONLINE</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PAINEL DE CONTROLE (ESQUERDA) */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
              onClick={() => document.getElementById('fIn').click()}
              className="group border-2 border-dashed border-zinc-800 bg-zinc-900/10 rounded-[2.5rem] p-12 text-center hover:border-green-500/40 hover:bg-green-500/5 transition-all cursor-pointer"
            >
              <UploadCloud className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-all group-hover:scale-110" size={56} />
              <h3 className="text-lg font-bold text-white tracking-tight">Inserir Documentos</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Arraste seus PDFs de Ofício ou Planilhas aqui</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 h-[350px] overflow-hidden flex flex-col">
              <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-4">Monitor de Sistema</h4>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scroll">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 animate-in fade-in slide-in-from-left-2">
                    {log.status === 'success' ? <CheckCircle2 className="text-green-500 mt-0.5" size={14} /> : 
                     log.status === 'error' ? <AlertCircle className="text-red-500 mt-0.5" size={14} /> : 
                     <Loader2 className="text-yellow-500 animate-spin mt-0.5" size={14} />}
                    <span className="text-[11px] leading-tight text-zinc-400">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL DE DADOS (DIREITA) */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[3rem] p-8 h-full min-h-[600px] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Database size={22} className="text-green-500" />
                  Auditorias Recentes
                </h3>
                <div className="h-px flex-1 bg-zinc-800 mx-6 hidden sm:block"></div>
                <span className="text-[10px] font-mono text-zinc-600 italic">Total: {docs.length}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {docs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-zinc-800 opacity-20">
                    <FileText size={60} strokeWidth={1} />
                    <p className="mt-4 italic text-sm">Aguardando entrada de dados...</p>
                  </div>
                )}
                
                {docs.map((doc) => (
                  <div key={doc.id} className="group bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center justify-between hover:border-green-500/20 transition-all hover:bg-zinc-900/60">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-black rounded-xl text-zinc-600 group-hover:text-green-500 transition-colors shadow-inner">
                        <FileText size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-green-400 transition-colors uppercase tracking-tight">{doc.nome_arquivo}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase">{doc.tipo_doc}</span>
                          <span className="text-[9px] text-zinc-600">•</span>
                          <span className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase">
                            {new Date(doc.data_leitura).toLocaleDateString()} {new Date(doc.data_leitura).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-[9px] font-black text-green-500 tracking-widest">
                        ESTOCADO
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
