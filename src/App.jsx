import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Zap, Database } from 'lucide-react';

// Conexão com o seu Supabase (gmhxmtlidgcgpstxiiwg)
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Configura o motor de PDF via CDN para evitar o erro 404 de worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const handleUpload = async (files) => {
    for (const file of Array.from(files)) {
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
          salvarNoBanco(text, file.name);
        } catch (e) {
          setLogs(prev => [`❌ Erro no arquivo: ${file.name}`, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const salvarNoBanco = async (texto, nome) => {
    let tipo = "Outros";
    if (texto.includes("RENAVAM")) tipo = "CRLV";
    if (texto.includes("DANFE")) tipo = "NOTA FISCAL";

    // Salvando na tabela que você criou no SQL Editor
    const { error } = await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      conteudo_extraido: { resumo: texto.substring(0, 500) }
    }]);

    if (!error) {
      setLogs(prev => [`✅ SALVO NO BANCO: ${tipo} (${nome})`, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-10 border-b border-zinc-800 pb-6">
          <ShieldCheck className="text-green-500" size={32} />
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Maximus PhD</h1>
        </header>

        <div 
          onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-zinc-800 p-20 rounded-[40px] text-center hover:border-green-500 transition-all cursor-pointer bg-zinc-950 group"
        >
          <UploadCloud className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500" size={50} />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Arraste seus documentos aqui</p>
        </div>

        <div className="mt-12 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-mono text-zinc-300">{log}</span>
              <Database size={16} className="text-zinc-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
