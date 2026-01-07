import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, FileText, Search, Printer, 
  UploadCloud, Loader2, Building2, 
  Camera, Cloud, CheckCircle2, 
  FileSpreadsheet, HardHat, Trash2, Scale
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

  const UNIDADE_ID = '8694084d-26a9-4674-848e-67ee5e1ba4d4';

  useEffect(() => {
    setIsMounted(true);
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

  const extrairDadosAuditoria = (texto) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---";
    const chassi = (texto.match(/[A-HJ-NPR-Z0-9]{17}/gi) || [])[0] || "---";
    const temAntt = /ANTT|RNTRC|ANTC/i.test(texto);
    return { placa, chassi, status_conformidade: temAntt ? 'CONFORME' : 'ALERTA' };
  };

  const handleUploadUniversal = async (files) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Analizando: ${file.name}` }, ...prev]);
      try {
        let content = "";
        const ext = file.name.split('.').pop().toLowerCase();
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
        }
        const info = extrairDadosAuditoria(content);
        await supabase.from('documentos_processados').insert([{
          unidade_id: UNIDADE_ID,
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: info,
          status_conformidade: info.status_conformidade,
          legenda_tecnica: ['jpg', 'jpeg', 'png'].includes(ext) ? 'Pendente...' : ''
        }]);
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', msg: `Sincronizado: ${file.name}` } : l));
        fetchData();
      } catch (err) {
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', msg: `Erro no arquivo` } : l));
      }
    }
  };

  const updateLegenda = async (id, val) => {
    await supabase.from('documentos_processados').update({ legenda_tecnica: val }).eq('id', id);
  };

  const deletarRegistro = async (id) => {
    if(confirm("Excluir evidência?")) {
      await supabase.from('documentos_processados').delete().eq('id', id);
      fetchData();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-400 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#080808] border-r border-zinc-900 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <ShieldCheck size={32} className="text-green-500" />
          <h1 className="text-xl font-black text-white italic tracking-tighter">MAXIMUS <span className="text-green-500 text-xs">PhD</span></h1>
        </div>
        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-green-500/10 text-green-500 rounded-xl text-xs font-bold border border-green-500/20"><HardHat size={16}/> Auditoria</button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-zinc-900 rounded-xl text-xs transition-all"><Camera size={16}/> Fotos</button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-zinc-900 rounded-xl text-xs transition-all"><Scale size={16}/> Leis</button>
        </nav>
        <div className="mt-auto p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-[10px] text-white font-bold mb-1"><Cloud size={14} className="text-green-500"/> DATABASE LIVE</div>
          <p className="text-[9px] text-zinc-600 truncate">Sincronizado: {UNIDADE_ID}</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.03)_0%,_transparent_50%)]">
        <header className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Building2 className="text-green-500" size={24}/>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Cardoso & Rates Engenharia</h2>
              <p className="text-[10px] text-zinc-500 font-medium">Licenciamento Ambiental - Estado do Pará</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              className="bg-black border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs w-64 focus:border-green-500 outline-none transition-all"
              placeholder="Pesquisar placa ou arquivo..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 overflow-y-auto space-y-6">
          {/* DROP ZONE */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUploadUniversal(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-zinc-800 p-12 rounded-[2rem] text-center hover:border-green-500/30 transition-all cursor-pointer group bg-zinc-900/10"
          >
            <UploadCloud size={48} className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-all" />
            <p className="text-xs font-bold text-white uppercase tracking-widest">Drop Zone Maximus PhD</p>
            <p className="text-[10px] text-zinc-600 mt-2">PDF, XLSX, DOCX e Imagens simultâneos</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUploadUniversal(e.target.files)} />
          </div>

          {/* TABELA */}
          <div className="bg-[#080808] border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-4">Documento</th>
                  <th className="p-4">Auditoria</th>
                  <th className="p-4">Análise / Legenda</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-b border-zinc-900/50 hover:bg-white/[0.01]">
                    <td className="p-4 flex items-center gap-4">
                      <div className="p-2 bg-zinc-900 rounded-lg text-zinc-600">
                        {doc.tipo_doc === 'PDF' ? <FileText size={18}/> : <FileSpreadsheet size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-white truncate w-48">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-600">{doc.tipo_doc} Sincronizado</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-green-500 font-mono font-bold tracking-wider">{doc.conteudo_extraido?.placa || "---"}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit ${doc.status_conformidade === 'CONFORME' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {doc.status_conformidade}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                       <textarea 
                        className="bg-black border border-zinc-800 rounded-lg p-2 text-[10px] w-full h-12 outline-none focus:border-green-500 text-zinc-400 resize-none"
                        defaultValue={doc.legenda_tecnica}
                        onBlur={(e) => updateLegenda(doc.id, e.target.value)}
                       />
                    </td>
                    <td className="p-4 text-right space-x-2">
                       <button className="p-2 hover:text-green-500 transition-colors"><Printer size={16}/></button>
                       <button onClick={() => deletarRegistro(doc.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
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
