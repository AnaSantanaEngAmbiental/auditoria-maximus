import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, ShieldCheck, Database, CheckCircle2, 
  FileText, Loader2, Search, Zap, X 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      setLogs(prev => [{ status: 'loading', msg: `Auditoria: ${file.name}` }, ...prev]);
      
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

        setLogs(prev => [{ status: 'success', msg: `Extraído: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro no arquivo` }, ...prev]);
      }
    }
    e.target.value = ""; 
  };

  // Filtro inteligente para busca
  const filteredDocs = docs.filter(doc => 
    doc.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.conteudo_extraido?.placa && doc.conteudo_extraido.placa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans p-2 text-[11px] selection:bg-green-500/20">
      <div className="max-w-[1200px] mx-auto space-y-3">
        
        {/* HEADER PhD v4.0 */}
        <header className="flex items-center justify-between bg-zinc-900/20 p-3 rounded-lg border border-zinc-800/40 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={16} />
            <h1 className="font-black text-white uppercase italic tracking-tighter">Maximus PhD v4.0</h1>
          </div>
          
          {/* BARRA DE BUSCA EM TEMPO REAL */}
          <div className="relative group">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-colors" size={12} />
            <input 
              type="text" 
              placeholder="BUSCAR PLACA OU ARQUIVO..."
              className="bg-black border border-zinc-800 rounded-md py-1.5 pl-8 pr-8 text-[9px] w-48 md:w-64 focus:border-green-500/50 outline-none transition-all placeholder:text-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-12 gap-3">
          
          {/* PAINEL DE COMANDO */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <div className="bg-zinc-900/10 border border-zinc-800/30 p-5 rounded-xl text-center">
              <button 
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 text-green-500 py-4 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/5"
              >
                <UploadCloud size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Importar Ofício</span>
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} onClick={(e) => e.stopPropagation()} />
              <p className="text-[7px] text-zinc-700 mt-3 uppercase tracking-widest font-bold">Processamento em 1-clique</p>
            </div>

            <div className="bg-zinc-900/10 border border-zinc-800/30 rounded-xl p-3 h-[250px] flex flex-col">
              <div className="flex items-center justify-between mb-2 border-b border-zinc-900 pb-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Logs de Auditoria</span>
                <Zap size={10} className="text-zinc-800" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide text-[9px]">
                {logs.length === 0 && <p className="text-zinc-800 italic mt-4 text-center">Aguardando...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 items-center text-zinc-500 py-1 border-b border-zinc-900/50 last:border-0">
                    {log.status === 'success' ? <CheckCircle2 size={10} className="text-green-500" /> : <Loader2 size={10} className="text-yellow-500 animate-spin" />}
                    <span className="truncate">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL DE RESULTADOS */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/5 border border-zinc-800/40 rounded-xl p-4 min-h-[500px]">
              <div className="flex items-center gap-2 mb-4">
                <Database size={12} className="text-green-500" />
                <h2 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">Resultados Filtrados ({filteredDocs.length})</h2>
              </div>

              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950/60 border border-zinc-800/50 p-2.5 rounded-lg flex items-center justify-between hover:border-green-500/30 transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-zinc-900 rounded-lg group-hover:text-green-500 transition-colors">
                        <FileText size={14} />
                      </div>
                      <div className="truncate">
                        <h4 className="text-[10px] font-bold text-zinc-300 uppercase truncate group-hover:text-white transition-colors">{doc.nome_arquivo}</h4>
                        <p className="text-[7px] text-zinc-600 font-mono tracking-tighter uppercase">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* PLACA COM ESTILO REFORÇADO */}
                      <div className="bg-black/80 px-4 py-2 rounded-md border border-zinc-800 min-w-[85px] text-center shadow-inner group-hover:border-green-500/20">
                        <span className="text-[5px] text-zinc-700 font-black block leading-none mb-1">PLACA</span>
                        <span className="text-[11px] font-black text-green-500 font-mono italic tracking-wider leading-none">
                          {doc.conteudo_extraido?.placa || "---"}
                        </span>
                      </div>
                      
                      <div className="bg-black/80 px-4 py-2 rounded-md border border-zinc-800 hidden sm:block min-w-[120px] text-center shadow-inner">
                        <span className="text-[5px] text-zinc-700 font-black block leading-none mb-1">CHASSI DOC</span>
                        <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase leading-none">
                          {doc.conteudo_extraido?.chassi?.substring(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredDocs.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-24 opacity-5">
                      <Search size={40} />
                      <p className="text-[10px] mt-2 font-black uppercase tracking-[5px]">Nenhum registro encontrado</p>
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
