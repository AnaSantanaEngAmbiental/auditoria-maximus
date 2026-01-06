import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Database, AlertTriangle } from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setIsMounted(true); // Só ativa o app no navegador
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const processarPDFs = async (files) => {
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
          await salvarAuditoria(text, file.name);
        } catch (err) {
          setLogs(prev => [`❌ Erro no arquivo ${file.name}`, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const salvarAuditoria = async (texto, nome) => {
    let tipo = "NÃO IDENTIFICADO";
    if (texto.includes("RENAVAM")) tipo = "CRLV";
    if (texto.includes("DANFE") || texto.includes("CHAVE DE ACESSO")) tipo = "NOTA FISCAL";

    const { error } = await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      conteudo_extraido: { resumo: texto.substring(0, 300) }
    }]);

    if (!error) {
      setLogs(prev => [`✅ [${tipo}] Processado: ${nome}`, ...prev]);
    }
  };

  // Trava de Segurança: Se não estiver montado, renderiza nada (Evita Erro #418)
  if (!isMounted) return <div className="bg-black min-h-screen" />;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-4 mb-12 border-b border-zinc-800 pb-8">
          <ShieldCheck className="text-green-500" size={40} />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Maximus Engine</h1>
            <p className="text-zinc-500 text-[10px] tracking-[4px] font-bold">AUDITORIA DE DOCUMENTOS v2</p>
          </div>
        </header>

        <div 
          onDrop={(e) => { e.preventDefault(); processarPDFs(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-zinc-800 rounded-[40px] p-24 text-center bg-zinc-950/50 hover:border-green-500 transition-all cursor-pointer group"
          onClick={() => document.getElementById('inputPDF').click()}
        >
          <UploadCloud className="mx-auto mb-6 text-zinc-700 group-hover:text-green-500 group-hover:scale-110 transition-transform" size={64} />
          <h2 className="text-xl font-bold mb-2">Solte seus 10 PDFs aqui</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">A análise começará instantaneamente</p>
          <input id="inputPDF" type="file" multiple className="hidden" onChange={(e) => processarPDFs(e.target.files)} />
        </div>

        <div className="mt-12 space-y-4">
          {logs.map((log, i) => (
            <div key={i} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl animate-in slide-in-from-bottom-2">
              <span className="text-sm font-mono text-zinc-300">{log}</span>
              <div className="flex gap-3 text-zinc-600">
                <Database size={16} />
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-20 text-zinc-800 italic text-sm border border-zinc-900 rounded-[40px]">
              Nenhum documento na fila de auditoria...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
