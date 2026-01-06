import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Database, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMounted(true); // Força a renderização apenas no cliente (resolve o erro de 2ª tentativa)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  if (!mounted) return null;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        setLogs(prev => [{ status: 'error', msg: `Apenas PDF: ${file.name}` }, ...prev]);
        continue;
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

          // ENVIO CORRIGIDO: Agora com unidade_id para evitar o erro 400
          const { error } = await supabase.from('documentos_processados').insert([{
            nome_arquivo: file.name,
            tipo_doc: tipo,
            conteudo_extraido: { resumo: text.substring(0, 500) },
            unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4' 
          }]);

          if (error) throw error;
          setLogs(prev => [{ status: 'success', msg: `Auditado: ${tipo} - ${file.name}` }, ...prev]);
        } catch (err) {
          setLogs(prev => [{ status: 'error', msg: `Falha no Banco: ${file.name}` }, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto border border-zinc-800 bg-zinc-950/50 rounded-[2.5rem] p-12 shadow-2xl">
        <header className="flex items-center gap-4 mb-10 border-b border-zinc-800 pb-8">
          <ShieldCheck className="text-green-500" size={40} />
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Maximus PhD Auditor</h1>
        </header>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
          onClick={() => document.getElementById('fIn').click()}
          className="border-2 border-dashed border-zinc-800 rounded-[2rem] p-24 text-center hover:border-green-500/50 transition-all cursor-pointer bg-black/40 group"
        >
          <UploadCloud className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500" size={60} />
          <p className="font-bold text-zinc-400">Arraste seus PDFs para Auditoria em Tempo Real</p>
          <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
        </div>

        <div className="mt-10 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className={`text-sm ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>{log.msg}</span>
              <Database size={16} className="text-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
