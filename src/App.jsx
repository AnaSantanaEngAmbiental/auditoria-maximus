import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, FileText, Search, Printer, 
  RotateCcw, UploadCloud, Loader2, Building2, 
  Camera, Cloud, CheckCircle2, AlertTriangle,
  FileSpreadsheet, HardHat, Trash2, Scale, Info
} from 'lucide-react';

// Credenciais Maximus PhD
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

  // ID fixo da Matriz Maximus definido no seu SQL Consolidado
  const UNIDADE_ID = '8694084d-26a9-4674-848e-67ee5e1ba4d4';

  useEffect(() => {
    setIsMounted(true);
    // Worker essencial para processamento de PDF sem travar o navegador
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    
    if (!error && data) setDocs(data);
    setLoading(false);
  };

  // Lógica de Extração Pericial (Doutorado Maximus)
  const extrairDadosAuditoria = (texto) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---";
    const chassi = (texto.match(/[A-HJ-NPR-Z0-9]{17}/gi) || [])[0] || "---";
    const temAntt = /ANTT|RNTRC|ANTC/i.test(texto);
    
    return {
      placa,
      chassi,
      status_conformidade: temAntt ? 'CONFORME' : 'ALERTA'
    };
  };

  const handleUploadUniversal = async (files) => {
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Analizando: ${file.name}` }, ...prev]);
      
      try {
        let content = "";
        const ext = file.name.split('.').pop().toLowerCase();

        // Processamento por Tipo de Arquivo
        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            content += text.items.map(s => s.str).join(" ") + " ";
          }
        } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          content = XLSX.utils.sheet_to_txt(wb.Sheets[wb.SheetNames[0]]);
        } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
          content = `EVIDENCIA_FOTOGRAFICA: ${file.name}`;
        }

        const infoExtraida = extrairDadosAuditoria(content);

        // Persistência no Supabase
        const { error } = await supabase.from('documentos_processados').insert([{
          unidade_id: UNIDADE_ID,
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: infoExtraida,
          status_conformidade: infoExtraida.status_conformidade,
          legenda_tecnica: ['jpg', 'jpeg', 'png'].includes(ext) ? 'Legenda técnica pendente de edição...' : ''
        }]);

        if (error) throw error;

        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', msg: `Sincronizado: ${file.name}` } : l));
        fetchData();
      } catch (err) {
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', msg: `Erro no processamento` } : l));
      }
    }
  };

  const updateLegenda = async (id, val) => {
    await supabase.from('documentos_processados').update({ legenda_tecnica: val }).eq('id', id);
  };

  const deletarRegistro = async (id) => {
    if(confirm("Deseja excluir esta evidência pericial?")) {
      await supabase.from('documentos_processados').delete().eq('id', id);
      fetchData();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-400 font-sans overflow-hidden">
      
      {/* SIDEBAR ESTRUTURAL */}
      <aside className="w-80 bg-[#050505] border-r border-zinc-800/40 p-6 flex flex-col gap-8 shadow-2xl z-10">
        <div className="flex items-center gap-4 py-4 border-b border-zinc-900">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">MAXIMUS <span className="text-green-500">PhD</span></h1>
            <p className="text-[7px] text-zinc-500 font-bold tracking-[4px] uppercase mt-1">Sincronização 2026</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button className="flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold">
            <HardHat size={18}/> Auditoria Técnica
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] transition-all">
            <Camera size={18}/> Relatório Fotográfico
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] transition-all">
            <Scale size={18}/> Normas & Leis
          </button>
        </nav>

        <div className="mt-auto p-5 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
           <div className="flex items-center gap-3 mb-2">
              <Cloud className="text-green-500 animate-pulse" size={16}/>
              <span className="text-[9px] text-white font-black uppercase tracking-widest">Database Live</span>
           </div>
           <p className="text-[8px] text-zinc-600 leading-relaxed uppercase font-bold tracking-tighter">Conectado: gmhxmtlidgcgpstxiiwg</p>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.05)_0%,_transparent_50%)]">
        
        <header className="p-8 border-b border-zinc-900/50 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
               <Building2 className="text-green-500" size={24}/>
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider leading-none">Cardoso & Rates Engenharia</h2>
              <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase tracking-widest italic">Licenciamento Ambiental Estado do Pará</p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
            <input 
              className="bg-black border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] w-[380px] focus:border-green-500 outline-none transition-all shadow-inner"
              placeholder="Buscar por placa, documento ou status..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          
          {/* ARRASTE E COLE UNIVERSAL */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUploadUniversal(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-zinc-900/5 border-2 border-dashed border-zinc-800/60 p-16 rounded-[3.5rem] text-center hover:border-green-500/40 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <UploadCloud size={64} className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500 transition-all transform group-hover:-translate-y-1" />
            <h3 className="text-sm font-black text-white uppercase tracking-[6px]">Drop Zone Maximus PhD</h3>
            <p className="text-[10px] text-zinc-600 mt-3 uppercase tracking-[2px]">Solte múltiplos arquivos (PDF, XLSX, DOCX, Imagens)</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUploadUniversal(e.target.files)} />
          </div>

          {/* MONITOR DE PROCESSAMENTO */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {logs.slice(0,4).map(log => (
              <div key={log.id} className="flex-shrink-0 flex items-center gap-4 px-6 py-4 bg-[#080808] border border-zinc-900 rounded-2xl animate-in slide-in-from-right-5">
                {log.status === 'loading' ? <Loader2 size={16} className="text-yellow-500 animate-spin"/> : <CheckCircle2 size={16} className="text-green-500"/>}
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter italic">{log.msg}</span>
              </div>
            ))}
          </div>

          {/* TABELA DE AUDITORIA CONSOLIDADA */}
          <div className="bg-[#080808] border border-zinc-800/40 rounded-[3rem] overflow-hidden shadow-2xl mb-10">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Documento / Evidência</th>
                  <th className="p-8 text-center">Auditoria Placa</th>
                  <th className="p-8">Legenda / Análise Técnica</th>
                  <th className="p-8 text-right pr-12">Gestão</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/40 hover:bg-green-500/[0.01] transition-all group">
                    <td className="p-8 flex items-center gap-6">
                      <div className="p-4 bg-zinc-900/80 rounded-2xl text-zinc-700 group-hover:text-green-500 border border-zinc-800/50 transition-colors">
                        {doc.tipo_doc === 'PDF' ? <FileText size={22}/> : doc.tipo_doc === 'XLSX' || doc.tipo_doc === 'CSV' ? <FileSpreadsheet size={22}/> : <Camera size={22}/>}
                      </div>
                      <div>
                        <p className="font-black text-white uppercase tracking-tighter group-hover:text-green-400 transition-colors">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-widest italic">{doc.tipo_doc} - Integrado Cloud</p>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="inline-flex flex-col gap-2">
                        <span className="text-green-500 font-black tracking-[3px] bg-green-500/5 px-3 py-1.5 rounded-xl border border-green-500/20 shadow-sm">
                          {doc.conteudo_extraido?.placa || "---"}
                        </span>
                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${doc.status_conformidade === 'CONFORME' ? 'border-green-500/20 text-green-700 bg-green-500/5' : 'border-yellow-500/20 text-yellow-700 bg-yellow-500/5'}`}>
                           {doc.status_conformidade}
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                       <textarea 
                        className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-4 text-[11px] w-full h-20 outline-none focus:border-green-500/50 text-zinc-400 transition-all resize-none scrollbar-hide italic"
                        placeholder="PhD: Insira aqui a análise técnica ou legenda para o laudo fotográfico..."
                        defaultValue={doc.legenda_tecnica}
                        onBlur={(e) => updateLegenda(doc.id, e.target.value)}
                       />
                    </td>
                    <td className="p-8 text-right pr-12">
                       <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                          <button className="p-3 bg-zinc-900 rounded-xl hover:text-green-500 transition-all border border-zinc-800">
                             <Printer size={18}/>
                          </button>
                          <button onClick={() => deletarRegistro(doc.id)} className="p-3 bg-zinc-900 rounded-xl hover:text-red-500 transition-all border border-zinc-800">
                             <Trash2 size={18}/>
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
