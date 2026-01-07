import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, ShieldCheck, Database, CheckCircle2, 
  AlertCircle, FileText, Loader2, Search 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchDocs();
  }, []);

  const extrairDados = (texto) => {
    const placaRegex = /[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi;
    const chassiRegex = /[A-HJ-NPR-Z0-9]{17}/gi;
    return {
      placa: (texto.match(placaRegex) || [])[0] || "---",
      chassi: (texto.match(chassiRegex) || [])[0] || "---"
    };
  };

  const fetchDocs = async () => {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

        setLogs(prev => [{ status: 'success', msg: `Placa: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro: ${file.name}` }, ...prev]);
      }
    }
    e.target.value = ""; // Limpa para o próximo
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans p-2 text-[11px]">
      <div className="max-w-[1200px] mx-auto space-y-3">
        
        <header className="flex items-center justify-between bg-zinc-900/20 p-3 rounded-lg border border-zinc-800/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={16} />
            <h1 className="font-black text-white uppercase italic tracking-tighter">Maximus Auditor</h1>
          </div>
          <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest border border-green-500/20 px-2 py-0.5 rounded">Live</span>
        </header>

        <div className="grid grid-cols-12 gap-3">
          
          {/* LADO ESQUERDO */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <div className="bg-zinc-900/10 border border-zinc-800/30 p-6 rounded-xl text-center">
              {/* BOTÃO REAL PARA EVITAR 2X CLIQUE */}
              <button 
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-green-500/10 border border-green-500/40 hover:bg-green-500/20 text-green-500 py-4 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <UploadCloud size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Selecionar Ofício</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                onClick={(e) => { e.stopPropagation(); }} // Impede o clique duplo fantasma
              />
              <p className="text-[8px] text-zinc-600 mt-3 uppercase tracking-tighter italic">Clique apenas uma vez</p>
            </div>

            <div className="bg-zinc-900/10 border border-zinc-800/30 rounded-xl p-3 h-[200px] flex flex-col">
              <span className="text-[8px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Logs</span>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 items-center text-zinc-500 leading-none py-1">
                    {log.status === 'success' ? <CheckCircle2 size={10} className="text-green-500" /> : <Loader2 size={10} className="text-yellow-500 animate-spin" />}
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LADO DIREITO */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/5 border border-zinc-800/40 rounded-xl p-4 min-h-[450px]">
              <div className="flex items-center gap-2 mb-4">
                <Database size={12} className="text-green-500" />
                <h2 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">Base de Dados</h2>
              </div>

              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950/60 border border-zinc-800/50 p-2 rounded-lg flex items-center justify-between hover:border-green-500/30 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={14} className="text-zinc-700 min-w-[14px]" />
                      <div className="truncate">
                        <h4 className="text-[9px] font-bold text-zinc-300 uppercase truncate">{doc.nome_arquivo}</h4>
                        <p className="text-[7px] text-zinc-600 font-mono tracking-tighter">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-black/80 px-3 py-1 rounded border border-zinc-800 min-w-[70px] text-center">
                        <span className="text-[5px] text-zinc-700 font-black block leading-none">Placa</span>
                        <span className="text-[10px] font-black text-green-500 font-mono italic">{doc.conteudo_extraido?.placa || "---"}</span>
                      </div>
                      
                      <div className="bg-black/80 px-3 py-1 rounded border border-zinc-800 hidden sm:block min-w-[100px] text-center">
                        <span className="text-[5px] text-zinc-700 font-black block leading-none">Chassi</span>
                        <span className="text-[8px] font-bold text-zinc-500 font-mono uppercase">{doc.conteudo_extraido?.chassi?.substring(0, 10)}...</span>
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
