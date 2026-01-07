import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { UploadCloud, ShieldCheck, Database, CheckCircle2, AlertCircle, FileText, Search } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]); // Novo estado para mostrar os documentos na tela

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
    fetchDocs(); // Carrega documentos existentes ao abrir
  }, []);

  // Busca o histórico do banco para mostrar na tela
  const fetchDocs = async () => {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false }).limit(5);
    if (data) setDocs(data);
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Lendo: ${file.name}` }, ...prev]);
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

        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { resumo: text.substring(0, 500) }, // Limita para não pesar
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        if (error) throw error;
        
        setLogs(prev => [{ status: 'success', msg: `Salvo: ${file.name}` }, ...prev]);
        fetchDocs(); // Atualiza a tabela na tela

      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro: ${err.message}` }, ...prev]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12 border-b border-zinc-900 pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <ShieldCheck className="text-green-500" size={36} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Maximus PhD</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] font-bold text-zinc-500 tracking-[3px] uppercase">Sistema de Auditoria v3.0</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna 1: Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
              onClick={() => document.getElementById('fIn').click()}
              className="border-2 border-dashed border-zinc-800 bg-zinc-900/20 rounded-[2rem] p-10 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-4 text-zinc-600 group-hover:text-green-500 transition-colors" size={50} />
              <h3 className="text-lg font-bold text-white">Upload Inteligente</h3>
              <p className="text-xs text-zinc-500 mt-2">Arraste PDF, Excel ou Word</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Console de Logs</h4>
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    {log.status === 'success' ? <CheckCircle2 className="text-green-500 min-w-[14px]" size={14} /> : 
                     log.status === 'error' ? <AlertCircle className="text-red-500 min-w-[14px]" size={14} /> : 
                     <Clock className="text-yellow-500 min-w-[14px]" size={14} />}
                    <span className={log.status === 'error' ? 'text-red-400' : 'text-zinc-300'}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2: Dados em Tempo Real (NOVO) */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] p-8 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database size={20} className="text-green-500" />
                  Base de Conhecimento
                </h3>
                <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">Últimos 5 registros</span>
              </div>

              <div className="space-y-2">
                {docs.length === 0 && <div className="text-center py-20 text-zinc-700 italic">Banco de dados aguardando entrada...</div>}
                
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-black/40 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between hover:border-green-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{doc.nome_arquivo}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{doc.tipo_doc} • {new Date(doc.data_leitura).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">PROCESSADO</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
