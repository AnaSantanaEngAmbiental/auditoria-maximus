import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, ShieldCheck } from 'lucide-react';

// --- CONEXÃO SEGURA ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusAuditoria() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMounted(true);
    // Só carrega o motor de PDF quando o navegador estiver pronto
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  const processarArquivos = async (files) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let texto = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            texto += content.items.map(s => s.str).join(" ");
          }
          analisarIA(texto, file.name);
        } catch (e) { console.error("Erro ao ler PDF"); }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const analisarIA = async (texto, nome) => {
    let tipo = "Outros";
    if (texto.includes("RENAVAM")) tipo = "CRLV";
    if (texto.includes("DANFE") || texto.includes("RANDON")) tipo = "NOTA FISCAL";

    // Salva no Supabase
    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      status: "Sucesso"
    }]);

    setLogs(p => [`✅ ${tipo} IDENTIFICADO: ${nome}`, ...p]);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-10 border-b border-zinc-800 pb-8">
          <ShieldCheck className="text-green-500" size={40} />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Maximus Auditoria</h1>
        </header>

        <div 
          onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="bg-zinc-950 border-2 border-dashed border-zinc-800 p-24 rounded-[40px] text-center hover:border-green-500 transition-all cursor-pointer group"
        >
          <UploadCloud className="mx-auto text-zinc-700 group-hover:text-green-500 mb-4" size={60} />
          <h2 className="text-xl font-bold">Solte seus arquivos aqui</h2>
          <p className="text-zinc-500 text-sm mt-2 font-mono tracking-widest">IA EM TEMPO REAL</p>
        </div>

        <div className="mt-10 space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex justify-between animate-in fade-in">
              <span className="text-xs font-mono">{log}</span>
              <Zap size={16} className="text-yellow-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
