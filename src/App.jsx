import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, FileText, AlertTriangle, Zap, Share2 } from 'lucide-react';

const supabase = createClient('SUA_URL_SUPABASE', 'SUA_CHAVE_ANON');

export default function MaximusIntegradorUniversal() {
  const [isClient, setIsClient] = useState(false);
  const [logs, setLogs] = useState([]);
  const [vencimentos, setVencimentos] = useState(0);

  useEffect(() => {
    setIsClient(true); // Mata o erro #418 do React/Vercel
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    buscarResumo();
  }, []);

  const buscarResumo = async () => {
    const { count } = await supabase.from('frota_veiculos').select('*', { count: 'exact' });
    setVencimentos(count || 0);
  };

  // MOTOR DE VARREDURA PhD (Arraste e Cole Geral)
  const processarArquivos = async (files) => {
    const lista = Array.from(files);
    
    for (const file of lista) {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let textoCompleto = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textoCompleto += content.items.map(s => s.str).join(" ");
        }

        classificarESalvar(textoCompleto, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const classificarESalvar = async (texto, nome) => {
    let info = { tipo: "Outros", dados: {} };

    // Lógica para CRLV (Ex: Placas TVO9D07 / TVO9D17)
    if (texto.includes("CERTIFICADO DE REGISTRO") || texto.includes("RENAVAM")) {
      info.tipo = "CRLV";
      info.dados.placa = texto.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
      info.dados.renavam = texto.match(/\d{11}/)?.[0];
    }
    // Lógica para Nota Fiscal Randon (Ex: Chassi BADY...)
    else if (texto.includes("DANFE") || texto.includes("RANDON")) {
      info.tipo = "NOTA_FISCAL";
      info.dados.chassi = texto.match(/[A-Z0-9]{17}/)?.[0];
    }
    // Lógica para SEMAS/OFÍCIO (Ex: Processo 2025/...)
    else if (texto.includes("SEMAS") || texto.includes("Processo")) {
      info.tipo = "SEMAS/OFICIO";
      info.dados.processo = texto.match(/\d{4}\/\d+/)?.[0];
    }

    // Salva o processamento no banco PhD
    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: info.tipo,
      dados_extraidos: info.dados
    }]);

    setLogs(prev => [`✅ ${info.tipo} processado: ${nome}`, ...prev]);
  };

  if (!isClient) return null;

  return (
    <div className="bg-black min-h-screen text-white p-6 font-sans">
      {/* HEADER DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border-l-4 border-green-500 p-6 rounded-xl">
          <p className="text-zinc-400 text-sm">Veículos na Frota</p>
          <h2 className="text-3xl font-bold">{vencimentos}</h2>
        </div>
        <div className="bg-zinc-900 border-l-4 border-blue-500 p-6 rounded-xl">
          <p className="text-zinc-400 text-sm">Documentos Lidos (IA)</p>
          <h2 className="text-3xl font-bold">{logs.length}</h2>
        </div>
      </div>

      {/* ÁREA DE ARRASTE E COLE UNIVERSAL */}
      <div 
        onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="bg-zinc-900 border-2 border-dashed border-zinc-700 p-16 rounded-3xl text-center hover:border-green-500 transition-all"
      >
        <UploadCloud className="mx-auto text-green-500 mb-4" size={50} />
        <h2 className="text-2xl font-bold mb-2">Arraste e Cole PhD</h2>
        <p className="text-zinc-500">Solte aqui CRLVs, Notas Fiscais, Ofícios ou Extratos ANTT</p>
      </div>

      {/* LOG DE ATIVIDADES EM TEMPO REAL */}
      <div className="mt-8 space-y-3">
        <h3 className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-xs tracking-widest">
          <Zap size={14} className="text-yellow-500" /> Fluxo de Dados Ativo
        </h3>
        {logs.map((log, index) => (
          <div key={index} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex justify-between items-center animate-in slide-in-from-left">
            <span className="text-sm font-mono">{log}</span>
            <CheckCircle size={18} className="text-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
