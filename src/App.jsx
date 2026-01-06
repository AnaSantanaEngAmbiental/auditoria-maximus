import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, FileText } from 'lucide-react';

// --- CREDENCIAIS DO PHILIPE ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusSistemaPhD() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ frota: 0, docs: 0 });

  // Resolve Erro #418: Só executa após o componente montar no navegador
  useEffect(() => {
    setMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    syncData();
  }, []);

  const syncData = async () => {
    const { count: f } = await supabase.from('frota_veiculos').select('*', { count: 'exact', head: true });
    const { count: d } = await supabase.from('documentos_processados').select('*', { count: 'exact', head: true });
    setStats({ frota: f || 0, docs: d || 0 });
  };

  const processarArquivos = async (files) => {
    const lista = Array.from(files);
    for (const file of lista) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let textoFull = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            textoFull += content.items.map(s => s.str).join(" ");
          }
          executarIA(textoFull, file.name);
        } catch (e) {
          console.error("Erro no PDF:", e);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const executarIA = async (texto, nome) => {
    let analise = { tipo: "Outros", dados: {} };

    // Regras de extração para os documentos enviados
    if (texto.includes("RENAVAM")) {
      analise.tipo = "CRLV";
      analise.dados.placa = texto.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
    } else if (texto.includes("DANFE") || texto.includes("RANDON")) {
      analise.tipo = "NOTA FISCAL";
      analise.dados.chassi = texto.match(/[A-Z0-9]{17}/)?.[0];
    } else if (texto.includes("SEMAS") || texto.includes("2025/")) {
      analise.tipo = "SEMAS/OFICIO";
      analise.dados.processo = texto.match(/\d{4}\/\d+/g)?.[0];
    }

    // Gravação no Supabase
    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: analise.tipo,
      dados_extraidos: analise.dados
    }]);

    setLogs(prev => [`✅ ${analise.tipo} PROCESSADO: ${nome}`, ...prev]);
    syncData();
  };

  // Prevenção crítica de erro de hidratação
  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans antialiased">
      {/* HEADER ESTATÍSTICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[3px]">Veículos na Base</p>
          <h2 className="text-5xl font-black text-green-500">{stats.frota}</h2>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[3px]">Leituras Realizadas</p>
          <h2 className="text-5xl font-black text-blue-500">{stats.docs}</h2>
        </div>
      </div>

      {/* ÁREA DE DROP - DESIGN PhD */}
      <div 
        onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="group bg-zinc-950 border-2 border-dashed border-zinc-800 p-16 rounded-[50px] text-center hover:border-green-500/50 transition-all cursor-pointer"
      >
        <UploadCloud className="mx-auto text-zinc-700 group-hover:text-green-500 transition-colors mb-4" size={60} />
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Motor de Auditoria Maximus</h1>
        <p className="text-zinc-500 text-sm">Solte aqui o Ofício SEMAS, as Notas da Randon ou os CRLVs</p>
      </div>

      {/* FEED DE PROCESSAMENTO */}
      <div className="mt-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monitor de IA Ativo</span>
        </div>
        
        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="border border-zinc-900 p-8 rounded-3xl text-center text-zinc-700 italic text-sm">
              Sistema pronto para receber documentos...
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-zinc-500" />
                <span className="text-xs font-mono text-zinc-300">{log}</span>
              </div>
              <CheckCircle size={18} className="text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
