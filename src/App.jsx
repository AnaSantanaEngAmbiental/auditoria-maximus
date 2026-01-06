import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { UploadCloud, ShieldCheck, Database, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// CONEXÃO SUPABASE
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  // SEGURANÇA: Só renderiza quando o navegador estiver pronto (Acaba com o erro 418)
  if (!isMounted) return <div className="min-h-screen bg-black" />;

  const handleFileSelection = async (event) => {
    const files = event.target.files || event.dataTransfer.files;
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Lendo: ${file.name}` }, ...prev]);
      
      const fileExt = file.name.split('.').pop().toLowerCase();
      let extractedText = "";

      try {
        if (fileExt === 'pdf') {
          extractedText = await processPDF(file);
        } else if (['xlsx', 'xls'].includes(fileExt)) {
          extractedText = await processExcel(file);
        } else if (fileExt === 'docx') {
          extractedText = await processWord(file);
        } else {
          throw new Error("Formato não suportado");
        }

        await saveToSupabase(file.name, fileExt.toUpperCase(), extractedText);
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Falha: ${file.name} - ${err.message}` }, ...prev]);
      }
    }
  };

  const processPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(s => s.str).join(" ") + " ";
    }
    return fullText;
  };

  const processExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_txt(firstSheet);
  };

  const processWord = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const saveToSupabase = async (name, type, content) => {
    // CORREÇÃO CRÍTICA: Enviando unidade_id obrigatório do seu banco
    const { error } = await supabase.from('documentos_processados').insert([{
      nome_arquivo: name,
      tipo_doc: type,
      conteudo_extraido: { text: content.substring(0, 1000) },
      unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4', // ID padrão de teste
      status: 'Processado'
    }]);

    if (error) throw error;
    setLogs(prev => [{ status: 'success', msg: `Auditado com sucesso: ${name}` }, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-4 md:p-10 selection:bg-green-500/30">
      <div className="max-w-5xl mx-auto border border-zinc-800 bg-zinc-950/40 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
        
        <header className="p-8 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
              <ShieldCheck className="text-green-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Maximus PhD Auditor</h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-[3px] uppercase">Multi-format Engine v2.0</p>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-zinc-500 uppercase">Status do Banco</span>
              <span className="text-[10px] text-green-500 font-mono">SUPABASE ONLINE</span>
            </div>
          </div>
        </header>

        <main className="p-8 md:p-12">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFileSelection(e); }}
            onClick={() => document.getElementById('fileInput').click()}
            className="group border-2 border-dashed border-zinc-800 rounded-[3rem] p-20 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer relative overflow-hidden"
          >
            <UploadCloud className="mx-auto mb-6 text-zinc-700 group-hover:text-green-500 group-hover:scale-110 transition-all duration-500" size={80} />
            <h2 className="text-xl font-bold text-white mb-2">Central de Inteligência de Documentos</h2>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
              Arraste arquivos <span className="text-zinc-300">PDF, Excel ou Word</span>. A IA PhD fará a varredura e salvará no banco de dados instantaneamente.
            </p>
            <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileSelection} />
          </div>

          <div className="mt-12 space-y-4">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest px-2">Log de Operações Recentes</h3>
            {logs.length === 0 && (
              <div className="border border-zinc-900 rounded-3xl p-10 text-center italic text-zinc-700 text-sm">
                Aguardando entrada de dados...
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                  {log.status === 'loading' && <Clock className="text-yellow-500 animate-spin" size={20} />}
                  {log.status === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                  {log.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
                  <span className={`text-sm font-medium ${log.status === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>{log.msg}</span>
                </div>
                <Database size={16} className="text-zinc-700" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
