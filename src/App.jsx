import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ShieldCheck, FileText, Search, Printer, Gavel, 
  RotateCcw, Briefcase, CheckCircle2, UploadCloud, 
  Loader2, Building2, Camera, Cloud, AlertCircle, 
  ChevronRight, HardHat, Info, Trash2, FileJson
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Perícia PhD: ${file.name}` }, ...prev]);
      
      try {
        let content = "";
        const ext = file.name.split('.').pop().toLowerCase();

        // MOTOR DE EXTRAÇÃO UNIVERSAL
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            content += text.items.map(s => s.str).join(" ") + " ";
          }
        } else if (['xlsx', 'csv'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          content = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        }

        // Lógica de Extração de Dados Críticos
        const info = {
          placa: (content.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---",
          chassi: (content.match(/[A-HJ-NPR-Z0-9]{17}/gi) || [])[0] || "---",
          validade: content.includes("2026") ? "VIGENTE" : "EXPIRADO"
        };

        await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: info,
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', msg: `Auditoria Concluída: ${file.name}` } : l));
        fetchData();
      } catch (err) {
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', msg: `Falha no Processamento` } : l));
      }
    }
  };

  const updateField = async (id, field, value) => {
    await supabase.from('documentos_processados').update({ [field]: value }).eq('id', id);
    fetchData();
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-400 font-sans overflow-hidden">
      
      {/* SIDEBAR PhD */}
      <aside className="w-80 bg-[#050505] border-r border-zinc-800/40 p-6 flex flex-col gap-8 shadow-2xl">
        <div className="flex items-center gap-4 py-4 border-b border-zinc-900">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter">MAXIMUS <span className="text-green-500">PhD</span></h1>
            <p className="text-[7px] text-zinc-500 font-bold tracking-[4px] uppercase mt-1">Sincronização Cloud Ativa</p>
          </div>
        </div>

        <nav className="flex flex-col gap-3">
          <button className="flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-[1.25rem] text-[11px] font-bold">
            <HardHat size={18}/> Auditoria Técnica
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-[1.25rem] text-[11px] transition-all">
            <Camera size={18}/> Relatório Fotográfico
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-[1.25rem] text-[11px] transition-all">
            <Scale size={18}/> Leis e Condicionantes
          </button>
        </nav>

        <div className="mt-auto p-5 bg-zinc-900/20 rounded-[1.5rem] border border-zinc-800/50">
           <div className="flex items-center gap-3 mb-3">
              <Cloud className="text-green-500" size={16}/>
              <span className="text-[9px] text-white font-black uppercase tracking-widest">Supabase + Vercel</span>
           </div>
           <p className="text-[8px] text-zinc-500 leading-relaxed italic">Acesso remoto garantido sem retrabalho. Banco de dados centralizado via GitHub.</p>
        </div>
      </aside>

      {/* PAINEL CENTRAL */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.05)_0%,_transparent_70%)] overflow-hidden">
        
        <header className="p-8 border-b border-zinc-900/50 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
               <Building2 className="text-green-500" size={28}/>
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tighter">Cardoso & Rates Engenharia</h2>
              <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">Licenciamento Ambiental Pará</p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
            <input 
              className="bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-[11px] w-[400px] focus:border-green-500 outline-none transition-all"
              placeholder="Buscar placa, chassi ou análise..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          
          <div className="grid grid-cols-12 gap-8">
            {/* DROPZONE PHD */}
            <div 
              onClick={() => fileInputRef.current.click()}
              className="col-span-12 lg:col-span-4 bg-zinc-900/5 border-2 border-dashed border-zinc-800/50 p-14 rounded-[3rem] text-center hover:border-green-500/30 transition-all cursor-pointer group shadow-2xl relative"
            >
              <UploadCloud size={60} className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500 transition-all" />
              <h3 className="text-sm font-black text-white uppercase tracking-[5px]">Arraste & Solte</h3>
              <p className="text-[9px] text-zinc-600 mt-3 uppercase tracking-[2px]">Universal: PDF, XLSX, JPG, JSON, CSV</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            {/* MONITOR DE LOGS */}
            <div className="col-span-12 lg:col-span-8 bg-[#080808] border border-zinc-800/40 rounded-[3rem] p-8 flex flex-col h-[280px] shadow-2xl overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[4px]">Monitor Técnico Maximus</span>
                  <RotateCcw size={14} className="text-zinc-800 cursor-pointer hover:text-green-500" onClick={fetchData}/>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-900 animate-in slide-in-from-right-4">
                      {log.status === 'success' ? <CheckCircle2 size={16} className="text-green-500"/> : <Loader2 size={16} className="text-yellow-500 animate-spin"/>}
                      <span className="text-[11px] text-zinc-400 font-mono italic">{log.msg}</span>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          {/* TABELA DE AUDITORIA CONSOLIDADA */}
          <div className="bg-[#080808] border border-zinc-800/40 rounded-[3.5rem] overflow-hidden shadow-2xl mb-12">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/40 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Arquivo / Auditoria</th>
                  <th className="p-8">Placa & Chassi</th>
                  <th className="p-8">Legenda / Condicionante</th>
                  <th className="p-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {docs.filter(d => d.nome_arquivo.includes(busca)).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/50 hover:bg-green-500/[0.02] transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-6">
                        <div className="p-5 bg-zinc-900/50 rounded-3xl text-zinc-600 group-hover:text-green-500 border border-zinc-800/50 transition-all">
                          {doc.tipo_doc === 'PDF' ? <FileText size={24}/> : doc.tipo_doc === 'JSON' ? <FileJson size={24}/> : <Camera size={24}/>}
                        </div>
                        <div>
                          <p className="font-black text-white uppercase tracking-tighter group-hover:text-green-400 transition-colors">{doc.nome_arquivo}</p>
                          <p className="text-[9px] text-zinc-600 mt-2 uppercase font-bold tracking-widest">Format: {doc.tipo_doc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-2">
                        <span className="text-green-500 font-black tracking-[3px] bg-green-500/5 px-3 py-1.5 rounded-xl border border-green-500/20 w-fit">
                          {doc.conteudo_extraido?.placa || "N/A"}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono italic">
                          {doc.conteudo_extraido?.chassi || "CHASSI NÃO LOCALIZADO"}
                        </span>
                      </div>
                    </td>
                    <td className="p-8">
                       <textarea 
                        className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-[11px] w-full h-20 outline-none focus:border-green-500/50 text-zinc-400 transition-all scrollbar-hide"
                        placeholder="PhD: Insira aqui a legenda técnica ou análise pericial..."
                        defaultValue={doc.legenda_tecnica}
                        onBlur={(e) => updateField(doc.id, 'legenda_tecnica', e.target.value)}
                       />
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="p-4 bg-zinc-900 rounded-2xl hover:text-green-500 border border-transparent hover:border-green-500/20 transition-all">
                          <Printer size={20}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
