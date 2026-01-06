import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, FileText, Database } from 'lucide-react';

// --- SUAS CREDENCIAIS CONFIGURADAS ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusSistemaPhD() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ frota: 0, docs: 0 });

  // ESCUDO: Só carrega o sistema após a montagem completa no navegador
  useEffect(() => {
    setMounted(true);
    // Configura o motor de PDF apenas no cliente
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    syncDashboard();
  }, []);

  const syncDashboard = async () => {
    try {
      const { count: f } = await supabase.from('frota_veiculos').select('*', { count: 'exact', head: true });
      const { count: d } = await supabase.from('documentos_processados').select('*', { count: 'exact', head: true });
      setStats({ frota: f || 0, docs: d || 0 });
    } catch (e) {
      console.log("Aguardando tabelas...");
    }
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
        analisarEGravar(textoTotal, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const analisarEGravar = async (texto, nome) => {
    let ia = { tipo: "Outros", dados: {} };

    if (texto.includes("RENAVAM")) {
      ia.tipo = "CRLV";
      ia.dados.placa = texto.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
    } else if (texto.includes("DANFE") || texto.includes("RANDON")) {
      ia.tipo = "NOTA FISCAL";
      ia.dados.chassi = texto.match(/[A-Z0-9]{17}/)?.[0];
    } else if (texto.includes("SEMAS") || texto.includes("2025/")) {
      ia.tipo = "SEMAS/OFICIO";
      ia.dados.processo = texto.match(/\d{4}\/\d+/g)?.[0];
    }

    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: ia.tipo,
      dados_extraidos: ia.dados
    }]);

    setLogs(p => [`✅ ${ia.tipo}: ${nome}`, ...p]);
    syncDashboard();
  };

  // Se não estiver montado, renderiza tela de carregamento preta (evita erro #418)
  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans antialiased">
      {/* HEADER ESTATÍSTICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[32px] backdrop-blur-md">
          <div className="flex items-center gap-3 text-green-500 mb-2">
            <Database size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Base de Dados Supabase</span>
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter">{stats.frota}</h2>
          <p className="text-zinc-500 text-sm mt-2">Veículos identificados na frota</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[32px] backdrop-blur-md">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <FileText size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Auditados pela IA</span>
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter">{stats.docs}</h2>
          <p className="text-zinc-500 text-sm mt-2">Documentos processados hoje</p>
        </div>
      </div>

      {/* ÁREA DE ARRASTE - FOCO NOS 10 ARQUIVOS */}
      <div 
        onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="group relative bg-zinc-900 border-2 border-dashed border-zinc-800 p-24 rounded-[60px] text-center hover:border-green-600 transition-all duration-700 cursor-crosshair overflow-hidden"
      >
        <div className="absolute inset-0 bg-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <UploadCloud className="mx-auto text-zinc-700 group-hover:text-green-500 group-hover:scale-110 transition-all duration-500 mb-6" size={80} />
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Motor de Auditoria Maximus</h1>
        <p className="text-zinc-500 max-w-md mx-auto">Solte aqui o Ofício SEMAS, as Notas da Randon ou os CRLVs para cruzamento automático.</p>
      </div>

      {/* MONITOR DE FLUXO */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6 px-4">
          <Zap size={16} className="text-yellow-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[4px]">Processamento em Tempo Real</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-2xl flex justify-between items-center hover:bg-zinc-800/40 transition-colors animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-mono text-zinc-300 tracking-tight">{log}</span>
              <CheckCircle size={18} className="text-green-500" />
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-800 text-center py-10 italic text-sm">Aguardando entrada de dados...</div>
          )}
        </div>
      </div>
    </div>
  );
}
