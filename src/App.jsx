import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, Zap, ShieldCheck, Database } from 'lucide-react';

// Conexão com o seu banco de dados Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Configura o motor de PDF via CDN para evitar erros de build
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const handleFileUpload = async (event) => {
    const files = event.target.files || event.dataTransfer.files;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(s => s.str).join(" ");
          }
          processarDocumento(fullText, file.name);
        } catch (e) {
          setLogs(prev => [`❌ Erro no PDF: ${file.name}`, ...prev]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processarDocumento = async (texto, nome) => {
    let tipo = "Outros";
    if (texto.includes("RENAVAM")) tipo = "CRLV";
    if (texto.includes("DANFE")) tipo = "NOTA FISCAL";
    if (texto.includes("SEMAS")) tipo = "OFICIO";

    // Envia para a tabela que você criou (imagem f0425f.png)
    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: tipo,
      conteudo_extraido: { texto_bruto: texto.substring(0, 1000) }
    }]);

    setLogs(prev => [`✅ ${tipo} detectado e salvo: ${nome}`, ...prev]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10 border-b border-zinc-800 pb-6">
          <ShieldCheck className="text-green-500" size={32} />
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Maximus PhD Auditor</h1>
        </div>

        <div 
          onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-zinc-800 p-20 rounded-3xl text-center hover:border-green-500 transition-colors cursor-pointer"
          onClick={() => document.getElementById('fileInput').click()}
        >
          <UploadCloud className="mx-auto mb-4 text-zinc-500" size={48} />
          <p className="text-zinc-400">Arraste os PDFs ou clique para selecionar</p>
          <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileUpload} />
        </div>

        <div className="mt-10 space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
              <span className="text-sm font-mono">{log}</span>
              <Database size={14} className="text-zinc-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
