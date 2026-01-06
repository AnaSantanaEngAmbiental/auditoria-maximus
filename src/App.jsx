import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { UploadCloud, ShieldCheck, Database, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// Credenciais Supabase
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-black" />;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Processando: ${file.name}` }, ...prev]);
      const ext = file.name.split('.').pop().toLowerCase();
      let text = "";

      try {
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(" ") + " ";
          }
        } else if (['xlsx', 'xls'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          text = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        } else if (ext === 'docx') {
          const buffer = await file.arrayBuffer();
          const res = await mammoth.extractRawText({ arrayBuffer: buffer });
          text = res.value;
        }

        // SALVAMENTO NO SUPABASE
        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { resumo: text.substring(0, 2000) },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        if (error) throw error;
        setLogs(prev => [{ status: 'success', msg: `Sucesso: ${file.name} auditado!` }, ...prev]);
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro em ${file.name}: ${err.message}` }, ...prev]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto border border-zinc-800 bg-zinc-950/40 rounded-[3rem] backdrop-blur-xl shadow-2xl overflow-hidden">
        
        <header className="p-10 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-green-500/10 p-4 rounded-3xl border border-green-500/20">
              <ShieldCheck className="text-green-500" size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Maximus PhD</h1>
              <span className="text-xs font-bold text-zinc-500 tracking-[4px] uppercase">Engine de Auditoria</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-green-500 animate-pulse">● SISTEMA ATIVO</div>
            <div className="text-xs text-zinc-600 font-mono">DB: SUPABASE CLOUD</div>
          </div>
        </header>

        <main className="p-10">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
            onClick={() => document.getElementById('fIn').click()}
            className="group border-2 border-dashed border-zinc-800 rounded-[3rem] p-24 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer"
          >
            <UploadCloud className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500 transition-colors" size={70} />
            <h2 className="text-xl font-bold text-white">Arraste seus Documentos</h2>
            <p className="text-zinc-500 mt-2">PDF, XLSX ou DOCX para processamento imediato</p>
            <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
          </div>

          <div className="mt-12 space-y-4">
            <h3 className="text-xs font-black text-zinc-700 uppercase tracking-[2px] px-2">Histórico de Varredura</h3>
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800 p-5 rounded-[1.5rem] animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  {log.status === 'loading' && <Clock className="text-yellow-500 animate-spin" size={20} />}
                  {log.status === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                  {log.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
                  <span className="text-sm font-medium">{log.msg}</span>
                </div>
                <Database size={16} className="text-zinc-800" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
