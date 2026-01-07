import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null); // Referência para o clique certeiro

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

  // FUNÇÃO DE UPLOAD CORRIGIDA PARA 1 CLIQUE
  const handleUpload = async (e) => {
    const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Processando: ${file.name}` }, ...prev]);
      
      try {
        let text = "";
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(" ") + " ";
          }
        } else if (['xlsx', 'xls'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          text = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        }

        const info = extrairDados(text);
        
        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { placa: info.placa.toUpperCase(), chassi: info.chassi.toUpperCase() },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        if (error) throw error;

        setLogs(prev => [{ status: 'success', msg: `Concluído: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Falha: ${file.name}` }, ...prev]);
      }
    }
    // Limpa o input para permitir subir o mesmo arquivo se necessário
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans p-2 md:p-4 selection:bg-green-500/30">
      <div className="max-w-[1200px] mx-auto space-y-3">
        
        {/* HEADER COMPACTO PHD */}
        <header className="flex items-center justify-between bg-zinc-900/10 p-3 rounded-xl border border-zinc-800/40">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={20} />
            <h1 className="text-sm font-black text-white uppercase italic tracking-tighter">Maximus PhD <span className="text-[8px] text-zinc-600 not-italic ml-2 tracking-widest">v3.7</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Cloud Active</span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-3">
          
          {/* LADO ESQUERDO: CONTROLE */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <div 
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
              className="bg-green-500/5 border border-dashed border-green-500/20 p-6 rounded-xl text-center hover:bg-green-500/10 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-2 text-green-500/40 group-hover:scale-110 transition-transform" size={32} />
              <p className="text-[9px] font-black text-white uppercase tracking-widest">Importar Arquivo</p>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleUpload} 
              />
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-3 h-[250px] flex flex-col">
              <span className="text-[8px] font-black text-zinc-700 uppercase mb-2 tracking-widest">Logs de Processamento</span>
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="text-[9px] p-2 bg-black/40 rounded-lg border border-zinc-800 flex items-center gap-2 animate-in fade-in">
                    {log.status === 'success' ? <CheckCircle2 size={10} className="text-green-500" /> : <Loader2 size={10} className="text-yellow-500 animate-spin" />}
                    <span className="truncate">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: RESULTADOS */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/5 border border-zinc-800/40 rounded-2xl p-4 min-h-[450px]">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                <Database size={14} className="text-green-500" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Relatório de Auditoria</h2>
              </div>

              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950 border border-zinc-900/60 p-3 rounded-lg flex items-center justify-between hover:border-green-500/20 transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText size={16} className="text-zinc-700" />
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-300 uppercase truncate max-w-[150px]">{doc.nome_arquivo}</h4>
                        <p className="text-[7px] text-zinc-600 font-mono italic">{new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-black px-3 py-1.5 rounded border border-zinc-800 text-center min-w-[70px]">
                        <span className="text-[6px] text-zinc-700 font-bold uppercase block leading-none mb-1">Placa</span>
                        <span className="text-[10px] font-black text-green-500 font-mono italic leading-none">
                          {doc.conteudo_extraido?.placa || "---"}
                        </span>
                      </div>
                      
                      <div className="bg-black px-3 py-1.5 rounded border border-zinc-800 hidden sm:block text-center min-w-[100px]">
                        <span className="text-[6px] text-zinc-700 font-bold uppercase block leading-none mb-1">Chassi</span>
                        <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase leading-none">
                          {doc.conteudo_extraido?.chassi?.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {docs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-10">
                    <Search size={30} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-2">Nenhum Registro</p>
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
