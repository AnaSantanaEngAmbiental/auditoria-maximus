import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Database, FileText } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMounted(true);
    // Usa o worker da mesma versão da lib para evitar conflitos
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }, []);

  if (!mounted) return <div className="bg-black min-h-screen" />;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        setLogs(prev => [`❌ Apenas PDF é aceito: ${file.name}`, ...prev]);
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
          await salvarNoSupabase(text, file.name);
        } catch (err) {
          setLogs(prev => [`❌ Erro ao ler PDF: ${file.name}`, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const salvarNoSupabase = async (texto, nome) => {
    const tipo = texto.includes("RENAVAM") ? "CRLV" : "NF-E";
    const { error } = await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      conteudo_extraido: { resumo: texto.substring(0, 500) }
    }]);

    setLogs(prev => [`${error ? '⚠️ Erro DB' : '✅ Sucesso'}: ${tipo} - ${nome}`, ...prev]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12 py-6 border-b border-zinc-800">
          <div className="p-3 bg-green-500/10 rounded-2xl">
            <ShieldCheck className="text-green-500" size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Maximus PhD Auditor</h1>
        </header>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
          onClick={() => document.getElementById('inputPDF').click()}
          className="group relative border-2 border-dashed border-zinc-800 bg-zinc-950/50 rounded-[2.5rem] p-20 text-center hover:border-green-500/50 transition-all cursor-pointer overflow-hidden"
        >
          <div className="relative z-10">
            <UploadCloud className="mx-auto mb-6 text-zinc-600 group-hover:text-green-500 transition-colors" size={56} />
            <h2 className="text-xl font-bold text-zinc-200">Arraste seus PDFs aqui</h2>
            <p className="text-zinc-500 text-sm mt-2">O sistema identificará CRLV e Notas Fiscais automaticamente</p>
          </div>
          <input id="inputPDF" type="file" multiple className="hidden" onChange={handleUpload} />
        </div>

        <div className="mt-12 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl animate-in fade-in duration-500">
              <span className="text-sm font-medium text-zinc-400">{log}</span>
              <div className="flex gap-2">
                 <FileText size={16} className="text-zinc-700" />
                 <Database size={16} className="text-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
