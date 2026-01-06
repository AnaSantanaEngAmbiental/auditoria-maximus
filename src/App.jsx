import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Database, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

// Conexão direta com seu projeto Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Worker externo para evitar erro de carregamento local
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  if (!mounted) return null;

  const processarArquivo = async (file) => {
    if (file.type !== "application/pdf") {
      setLogs(prev => [{ status: 'error', msg: `Apenas PDF: ${file.name}` }, ...prev]);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(" ");
        }
        
        const tipo = text.includes("RENAVAM") ? "CRLV" : "NF-E";

        // Inserção corrigida com unidade_id para evitar erro 404/500
        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: tipo,
          conteudo_extraido: { resumo: text.substring(0, 600) },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4' // UUID de fallback
        }]);

        if (error) throw error;
        setLogs(prev => [{ status: 'success', msg: `${tipo} processado: ${file.name}` }, ...prev]);
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Falha no Banco: ${file.name}` }, ...prev]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans antialiased">
      <div className="max-w-5xl mx-auto border border-zinc-800 bg-zinc-950/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <header className="p-8 border-b border-zinc-800 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ShieldCheck className="text-green-500" size={28} />
            </div>
            <h1 className="text-xl font-black uppercase tracking-widest italic text-green-500">Maximus PhD Engine</h1>
          </div>
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Sistema Ativo</span>
          </div>
        </header>

        <main className="p-12">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(processarArquivo); }}
            onClick={() => document.getElementById('inputPDF').click()}
            className={`border-2 border-dashed rounded-[2rem] p-24 text-center transition-all cursor-pointer 
              ${isDragging ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 hover:border-zinc-600 bg-black/40'}`}
          >
            <UploadCloud className={`mx-auto mb-6 transition-colors ${isDragging ? 'text-green-500' : 'text-zinc-700'}`} size={64} />
            <h2 className="text-2xl font-bold mb-2">Central de Auditoria</h2>
            <p className="text-zinc-500">Solte seus arquivos PDF (CRLV ou NF-e) para varredura imediata</p>
            <input id="inputPDF" type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files).forEach(processarArquivo)} />
          </div>

          <div className="mt-10 space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 animate-in slide-in-from-top-1">
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? <CheckCircle2 className="text-green-500" size={18} /> : <AlertCircle className="text-red-500" size={18} />}
                  <span className={`text-sm font-medium ${log.status === 'success' ? 'text-zinc-300' : 'text-red-400'}`}>{log.msg}</span>
                </div>
                <Database size={14} className="text-zinc-700" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
