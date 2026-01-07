import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, ShieldCheck, Database, CheckCircle2, 
  AlertCircle, FileText, Loader2, Search, LayoutDashboard 
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
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    // FORÇA O CARREGAMENTO IMEDIATO NA PRIMEIRA VEZ
    const timer = setTimeout(() => fetchDocs(), 500);
    return () => clearTimeout(timer);
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
    try {
      const { data, error } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
      if (error) throw error;
      if (data) setDocs(data);
    } catch (err) {
      console.error("Erro Supabase:", err.message);
    }
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

        setLogs(prev => [{ status: 'success', msg: `OK: ${info.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro no arquivo` }, ...prev]);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans p-2 md:p-4 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto space-y-4">
        
        {/* HEADER COMPACTO */}
        <header className="flex items-center justify-between bg-zinc-900/20 p-4 rounded-2xl border border-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
              <ShieldCheck className="text-green-500" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white uppercase italic leading-none">Maximus PhD</h1>
              <p className="text-[8px] tracking-[2px] text-zinc-600 font-bold uppercase">Auditoria de Frota</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="text-right leading-none">
                <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Sistema Ativo</span>
             </div>
             <LayoutDashboard className="text-zinc-800" size={20} />
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          
          {/* COLUNA ESQUERDA (MENOR) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div 
              onClick={() => document.getElementById('fIn').click()}
              className="bg-green-500/5 border border-dashed border-green-500/20 p-6 rounded-2xl text-center hover:bg-green-500/10 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-2 text-green-500/30 group-hover:text-green-500" size={32} />
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Carregar Ofício</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-black/40 border border-zinc-900 rounded-2xl p-4 h-[300px] flex flex-col">
              <h3 className="text-[9px] font-black text-zinc-700 mb-3 tracking-widest uppercase">Console</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide text-[10px]">
                {logs.map((log, i) => (
                  <div key={i} className="p-2 bg-zinc-900/30 rounded-lg border border-zinc-800/40 flex gap-2 items-center">
                    {log.status === 'success' ? <CheckCircle2 size={12} className="text-green-500" /> : <Loader2 size={12} className="text-yellow-500 animate-spin" />}
                    <span className="truncate">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (TABELA) */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/5 border border-zinc-800/60 rounded-[2rem] p-4 min-h-[500px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-green-500" />
                  <h2 className="text-[11px] font-black text-white uppercase tracking-widest">Base de Dados</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950/40 border border-zinc-900/30 p-3 rounded-xl flex items-center justify-between hover:bg-zinc-900/30 transition-all group">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText size={18} className="text-zinc-700 group-hover:text-green-500" />
                      <div className="overflow-hidden">
                        <h4 className="text-[11px] font-bold text-zinc-200 truncate uppercase tracking-tight">{doc.nome_arquivo}</h4>
                        <p className="text-[8px] text-zinc-600 font-mono italic">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-black/60 px-4 py-2 rounded-lg border border-zinc-800 text-center min-w-[80px]">
                        <span className="text-[7px] text-zinc-700 font-black uppercase block">Placa</span>
                        <span className="text-xs font-black text-green-500 font-mono tracking-wider italic">
                          {doc.conteudo_extraido?.placa || "---"}
                        </span>
                      </div>
                      
                      <div className="bg-black/60 px-4 py-2 rounded-lg border border-zinc-800 hidden md:block text-center min-w-[120px]">
                        <span className="text-[7px] text-zinc-700 font-black uppercase block">Chassi</span>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase truncate">
                          {doc.conteudo_extraido?.chassi?.substring(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {docs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-10">
                    <Search size={40} />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[5px]">Aguardando Ofícios</p>
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
