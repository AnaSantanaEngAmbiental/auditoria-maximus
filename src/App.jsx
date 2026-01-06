import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, ShieldCheck, Database } from 'lucide-react';

// --- CONFIGURAÇÃO PHILIPE ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusSistemaPhD() {
  const [isClient, setIsClient] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ frota: 0, docs: 0 });

  // RESOLUÇÃO DO ERRO #418
  useEffect(() => {
    setIsClient(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    syncDashboard();
  }, []);

  const syncDashboard = async () => {
    try {
      const { count: f } = await supabase.from('frota_veiculos').select('*', { count: 'exact', head: true });
      const { count: d } = await supabase.from('documentos_processados').select('*', { count: 'exact', head: true });
      setStats({ frota: f || 0, docs: d || 0 });
    } catch (e) { console.error("Erro Supabase"); }
  };

  const processarArquivos = async (files) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let textoTotal = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textoTotal += content.items.map(s => s.str).join(" ");
        }
        classificar(textoTotal, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const classificar = async (texto, nome) => {
    let doc = { tipo: "Outros", dados: {} };

    if (texto.includes("RENAVAM")) {
      doc.tipo = "CRLV";
      doc.dados.placa = texto.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
    } else if (texto.includes("DANFE") || texto.includes("RANDON")) {
      doc.tipo = "NOTA FISCAL";
      doc.dados.chassi = texto.match(/[A-Z0-9]{17}/)?.[0];
    } else if (texto.includes("SEMAS")) {
      doc.tipo = "OFICIO/SEMAS";
      doc.dados.processo = texto.match(/\d{4}\/\d+/g)?.[0];
    }

    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: doc.tipo,
      dados_extraidos: doc.dados
    }]);

    setLogs(p => [`✅ ${doc.tipo}: ${nome}`, ...p]);
    syncDashboard();
  };

  // ESCUDO ANTI-TRAVAMENTO
  if (!isClient) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans antialiased">
      {/* INDICADOR DE STATUS */}
      <div className="flex items-center gap-2 mb-8 bg-zinc-900/50 w-fit px-4 py-2 rounded-full border border-zinc-800">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Servidor Maximus Online</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-[32px] border border-zinc-800 shadow-2xl">
          <Database className="text-green-500 mb-4" size={24} />
          <h2 className="text-5xl font-black tracking-tighter">{stats.frota}</h2>
          <p className="text-zinc-500 font-bold text-xs uppercase mt-2">Veículos na Frota</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-[32px] border border-zinc-800 shadow-2xl">
          <ShieldCheck className="text-blue-500 mb-4" size={24} />
          <h2 className="text-5xl font-black tracking-tighter">{stats.docs}</h2>
          <p className="text-zinc-500 font-bold text-xs uppercase mt-2">Documentos Auditados</p>
        </div>
      </div>

      <div 
        onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="group relative bg-zinc-900 border-2 border-dashed border-zinc-800 p-24 rounded-[60px] text-center hover:border-green-500 transition-all cursor-pointer"
      >
        <UploadCloud className="mx-auto text-zinc-800 group-hover:text-green-500 transition-all mb-4" size={70} />
        <h1 className="text-3xl font-black italic uppercase">Motor de Auditoria PhD</h1>
        <p className="text-zinc-500 mt-2">Arraste os 10 arquivos (SEMAS, Notas e CRLVs)</p>
      </div>

      <div className="mt-10 space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xs font-mono text-zinc-300">{log}</span>
            <CheckCircle size={20} className="text-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
