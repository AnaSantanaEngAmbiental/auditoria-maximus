import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { UploadCloud, ShieldCheck, Database, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';

// Credenciais Supabase - Conexão Maximus
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  // 1. Efeito de Inicialização (Resolve erro de 1ª carga)
  useEffect(() => {
    setIsMounted(true);
    // Configura o motor de PDF via CDN estável
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  // Bloqueio de segurança contra erro de hidratação
  if (!isMounted) return <div className="min-h-screen bg-black" />;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Varredura iniciada: ${file.name}` }, ...prev]);
      const ext = file.name.split('.').pop().toLowerCase();
      let extractedText = "";

      try {
        // 2. Processamento Multi-Formato
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            extractedText += content.items.map(s => s.str).join(" ") + " ";
          }
        } else if (['xlsx', 'xls'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          extractedText = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        } else if (ext === 'docx') {
          const buffer = await file.arrayBuffer();
          const res = await mammoth.extractRawText({ arrayBuffer: buffer });
          extractedText = res.value;
        }

        // 3. Sincronização com Supabase (Tabela reconstruída)
        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { 
            resumo: extractedText.substring(0, 3000),
            data_hora: new Date().toISOString()
          },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4' // UUID Matriz
        }]);

        if (error) throw error;
        setLogs(prev => [{ status: 'success', msg: `✅ Auditado: ${file.name}` }, ...prev]);

      } catch (err) {
        console.error(err);
        setLogs(prev => [{ status: 'error', msg: `❌ Falha: ${file.name} - ${err.message}` }, ...prev]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-6 md:p-12 selection:bg-green-500/30">
      <div className="max-w-5xl mx-auto border border-zinc-800 bg-zinc-950/40 rounded-[3rem] backdrop-blur-2xl shadow-2xl overflow-hidden">
        
        {/* Header Profissional */}
        <header className="p-10 border-b border-zinc-900 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-5">
            <div className="bg-green-500/10 p-4 rounded-3xl border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <ShieldCheck className="text-green-500" size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Maximus PhD</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-zinc-500 tracking-[3px] uppercase">Auditoria Inteligente</span>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-600 font-mono mb-1">PROJETO: AUDITORIA_V2</div>
            <div className="inline-block px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] font-bold text-green-500">
              SUPABASE CONNECTED
            </div>
          </div>
        </header>

        <main className="p-10">
          {/* Zona de Drop Inteligente */}
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#27272a'; handleUpload(e); }}
            onClick={() => document.getElementById('fileIn').click()}
            className="group relative border-2 border-dashed border-zinc-800 rounded-[3rem] p-24 text-center hover:bg-green-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <UploadCloud className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500 group-hover:scale-110 transition-all duration-500" size={80} />
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Central de Upload</h2>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
              Arraste <span className="text-zinc-300">PDF, Excel ou Word</span> para auditoria instantânea no banco de dados.
            </p>
            <input id="fileIn" type="file" multiple className="hidden" onChange={handleUpload} />
          </div>

          {/* Console de Logs Estilizado */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest">Atividade do Sistema</h3>
              <span className="text-[10px] text-zinc-700 font-mono italic">v2.0.4-stable</span>
            </div>
            
            {logs.length === 0 && (
              <div className="border border-zinc-900 rounded-3xl p-16 text-center">
                <FileText className="mx-auto mb-4 text-zinc-800" size={32} />
                <p className="italic text-zinc-700 text-sm">Nenhum documento processado nesta sessão.</p>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 p-5 rounded-[1.5rem] animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-4">
                    {log.status === 'loading' && <Clock className="text-yellow-500 animate-spin" size={20} />}
                    {log.status === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                    {log.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
                    <span className={`text-sm font-medium ${log.status === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>
                      {log.msg}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${log.status === 'success' ? 'bg-green-500 w-full' : 'bg-zinc-700 w-1/2'}`}></div>
                    </div>
                    <Database size={14} className="text-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
