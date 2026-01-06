import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, ShieldCheck, Database } from 'lucide-react';

// --- CONEXÃO PHILIPE ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusAuditoria() {
  const [isClient, setIsClient] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setIsClient(true);
    // Configura o motor de PDF apenas no seu computador, não no servidor
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const handleFiles = async (files) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(reader.result) }).promise;
        let texto = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texto += content.items.map(s => s.str).join(" ");
        }
        processarIA(texto, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processarIA = async (texto, nome) => {
    let tipo = "Outros";
    if (texto.includes("RENAVAM")) tipo = "CRLV";
    if (texto.includes("DANFE") || texto.includes("RANDON")) tipo = "NOTA FISCAL";

    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      status: "Sucesso"
    }]);

    setLogs(p => [`✅ ${tipo} DETECTADO: ${nome}`, ...p]);
  };

  // Trava de segurança contra erro #418
  if (!isClient) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12 border-b border-zinc-800 pb-8">
          <div className="bg-green-500/10 p-3 rounded-2xl">
            <ShieldCheck className="text-green-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase">Maximus Engine</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-[3px]">Auditoria de Documentos PhD</p>
          </div>
        </header>

        <div 
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-20 rounded-[40px] text-center hover:border-green-500 transition-all cursor-pointer group"
        >
          <UploadCloud className="mx-auto text-zinc-700 group-hover:text-green-500 mb-6" size={60} />
          <h2 className="text-xl font-bold">Arraste seus 10 arquivos aqui</h2>
          <p className="text-zinc-500 text-sm mt-2 font-mono">Processamento via Supabase Cloud</p>
        </div>

        <div className="mt-12 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex justify-between animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-mono text-zinc-300">{log}</span>
              <div className="flex gap-2">
                <Database size={16} className="text-blue-500" />
                <Zap size={16} className="text-yellow-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
