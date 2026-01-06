import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, ShieldCheck, Database } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  if (!mounted) return null;

  const handleFiles = async (files) => {
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
          
          // Enviando para a tabela documentos_processados (imagem f0425f.png)
          const { error } = await supabase.from('documentos_processados').insert([{
            nome_arquivo: file.name,
            tipo_doc: text.includes("RENAVAM") ? "CRLV" : "NF-E",
            conteudo_extraido: { texto: text.substring(0, 500) }
            // unidade_id: 'seu-uuid-aqui' // Se for obrigatório, adicione um ID válido
          }]);

          setLogs(prev => [`${error ? '❌' : '✅'} ${file.name}`, ...prev]);
        } catch (e) {
          setLogs(prev => [`❌ Erro: ${file.name}`, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto border border-zinc-800 rounded-[3rem] p-12 bg-zinc-950">
        <div className="flex items-center gap-4 mb-12">
          <ShieldCheck className="text-green-500" size={40} />
          <h1 className="text-3xl font-black uppercase italic">Maximus PhD</h1>
        </div>

        <div 
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('fileIn').click()}
          className="border-2 border-dashed border-zinc-800 rounded-[2rem] p-20 text-center cursor-pointer hover:border-green-500 transition-all"
        >
          <UploadCloud className="mx-auto mb-4 text-zinc-700" size={60} />
          <p className="font-bold text-zinc-400">Arraste seus documentos para Auditoria</p>
          <input id="fileIn" type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <div className="mt-8 space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900 p-4 rounded-xl flex justify-between font-mono text-xs">
              {log} <Database size={14} className="text-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
