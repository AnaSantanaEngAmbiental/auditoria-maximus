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
    setMounted(true);
    // Garante o carregamento do motor de PDF sem erros 404
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  const processarAuditoria = async (files) => {
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        setLogs(prev => [{ status: 'error', msg: `Formato inválido: ${file.name}` }, ...prev]);
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

          // Envio corrigido para o Supabase
          const { error } = await supabase.from('documentos_processados').insert([{
            nome_arquivo: file.name,
            tipo_doc: tipo,
            conteudo_extraido: { resumo: text.substring(0, 500) },
            unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4' // ID padrão para evitar erro 404
          }]);

          if (error) throw error;
          setLogs(prev => [{ status: 'success', msg: `Auditado: ${tipo} - ${file.name}` }, ...prev]);
        } catch (err) {
          setLogs(prev => [{ status: 'error', msg: `Erro no Banco: ${file.name}` }, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto border border-zinc-800 bg-zinc-950/50 rounded-[2.5rem] p-12 shadow-2xl">
        <header className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-green-500/10 rounded-2xl">
            <ShieldCheck className="text-green-500" size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Maximus PhD Engine</h1>
        </header>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); processarAuditoria(e.dataTransfer.files); }}
          onClick={() => document.getElementById('fileIn').click()}
          className="border-2 border-dashed border-zinc-800 rounded-[2rem] p-20 text-center hover:border-green-500/50 transition-all cursor-pointer bg-black/40 group"
        >
          <UploadCloud className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-colors" size={60} />
          <p className="font-bold text-zinc-400 group-hover:text-zinc-200">Arraste seus PDFs para Auditoria</p>
          <input id="fileIn" type="file" multiple className="hidden" onChange={(e) => processarAuditoria(e.target.files)} />
        </div>

        <div className="mt-10 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 border-l-4 border-l-green-500/50">
              <div className="flex items-center gap-3">
                {log.status === 'success' ? <CheckCircle2 className="text-green-500" size={18} /> : <AlertCircle className="text-red-500" size={18} />}
                <span className="text-sm font-medium text-zinc-300">{log.msg}</span>
              </div>
              <Database size={14} className="text-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
