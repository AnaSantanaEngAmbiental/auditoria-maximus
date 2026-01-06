import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

// --- CONFIGURAÇÃO SEGURA ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MaximusSistemaPhD() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ frota: 0, docs: 0 });
  const [busca, setBusca] = useState("");

  // CORREÇÃO: Garante que nada de navegador rode no servidor da Vercel
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    syncData();
  }, []);

  const syncData = async () => {
    try {
      const { count: f } = await supabase.from('frota_veiculos').select('*', { count: 'exact', head: true });
      const { count: d } = await supabase.from('documentos_processados').select('*', { count: 'exact', head: true });
      setStats({ frota: f || 0, docs: d || 0 });
    } catch (e) { console.error("Erro na base"); }
  };

  // CORREÇÃO: useMemo com proteção contra 'undefined' (Erro de Build Comum)
  const logsFiltrados = useMemo(() => {
    return logs.filter(log => 
      (log || "").toLowerCase().includes((busca || "").toLowerCase())
    );
  }, [logs, busca]);

  const processarArquivos = async (files) => {
    if (typeof window === 'undefined') return;
    
    for (const file of Array.from(files)) {
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
          classificarEGravar(textoFull, file.name);
        } catch (err) {
          setLogs(p => [`❌ Erro no PDF: ${file.name}`, ...p]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const classificarEGravar = async (texto, nome) => {
    let analise = { tipo: "Outros", dados: {} };

    // Lógica de Extração Philipe (Protegida)
    const txt = texto || "";
    if (txt.includes("RENAVAM")) {
      analise.tipo = "CRLV";
      analise.dados.placa = txt.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
    } else if (txt.includes("DANFE") || txt.includes("RANDON")) {
      analise.tipo = "NOTA FISCAL";
      analise.dados.chassi = txt.match(/[A-Z0-9]{17}/)?.[0];
    }

    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: analise.tipo,
      dados_extraidos: analise.dados,
      status: "Processado"
    }]);

    setLogs(prev => [`✅ ${analise.tipo}: ${nome}`, ...prev]);
    syncData();
  };

  // Renderização de segurança (Hydration Shield)
  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800">
            <div className="flex items-center gap-2 text-green-500 mb-2 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={16} /> Base Supabase
            </div>
            <h2 className="text-6xl font-black italic">{stats.frota}</h2>
            <p className="text-zinc-500 text-sm mt-2">Veículos na frota ativos</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800">
            <div className="flex items-center gap-2 text-blue-500 mb-2 font-bold text-xs uppercase tracking-widest">
              <Zap size={16} /> Auditoria IA
            </div>
            <h2 className="text-6xl font-black italic">{stats.docs}</h2>
            <p className="text-zinc-500 text-sm mt-2">Documentos lidos com sucesso</p>
          </div>
        </div>

        {/* DROPZONE */}
        <div 
          onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="bg-zinc-950 border-2 border-dashed border-zinc-800 p-20 rounded-[50px] text-center hover:border-green-500 transition-all cursor-pointer group"
        >
          <UploadCloud className="mx-auto text-zinc-800 group-hover:text-green-500 mb-4 transition-colors" size={60} />
          <h1 className="text-2xl font-black uppercase italic">Motor Maximus Auditor</h1>
          <p className="text-zinc-500">Arraste os documentos aqui para processamento instantâneo</p>
        </div>

        {/* MONITOR */}
        <div className="mt-10">
          <input 
            type="text" 
            placeholder="Filtrar logs..." 
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4 text-sm outline-none focus:border-green-500"
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="space-y-2">
            {logsFiltrados.map((log, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex justify-between items-center text-xs font-mono">
                <span>{log}</span>
                <CheckCircle size={16} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
