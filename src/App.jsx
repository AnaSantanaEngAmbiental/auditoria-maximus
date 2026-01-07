import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, FileText, Search, Printer, 
  UploadCloud, Loader2, Building2, 
  Camera, Cloud, CheckCircle2, 
  FileSpreadsheet, HardHat, Trash2, Scale, AlertCircle
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

  // Lógica de Auditoria Avançada para SEMAS/PA
  const realizarAuditoriaDoutorado = (texto, nomeArquivo) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---";
    const chassi = (texto.match(/[A-HJ-NPR-Z0-9]{17}/gi) || [])[0] || "---";
    
    // Identifica se é Nota Fiscal de Veículo Novo (Isenção CIV)
    const eNotaFiscal = /NOTA FISCAL|DANFE/i.test(texto) || nomeArquivo.toLowerCase().includes('nf');
    const eZeroKm = eNotaFiscal && (/0KM|ZERO KM|ANO FABRICACAO 2025/i.test(texto));
    
    // Identifica CTPP e Validade
    const eCTPP = /CTPP|INMETRO/i.test(texto);
    const vencimentoCTPP = (texto.match(/\d{2}\/[A-Z]{3}\/\d{2}/gi) || [])[0] || "---";

    let analiseDoc = "Documento padrão analisado.";
    if (eZeroKm) analiseDoc = "VEÍCULO 0KM: Isento de CIV por 12 meses (Portaria Inmetro 127/2022).";
    if (eCTPP) analiseDoc = `CTPP Identificado. Vencimento: ${vencimentoCTPP}`;

    return {
      placa,
      chassi,
      status: (eCTPP || eZeroKm || /ANTT/i.test(texto)) ? 'CONFORME' : 'ANÁLISE',
      detalhes: analiseDoc
    };
  };

  const handleUpload = async (files) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Auditoria técnica: ${file.name}` }, ...prev]);
      
      try {
        let textContent = "";
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(s => s.str).join(" ") + " ";
          }
        }

        const auditoria = realizarAuditoriaDoutorado(textContent, file.name);

        await supabase.from('documentos_processados').insert([{
          unidade_id: UNIDADE_ID,
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: auditoria,
          status_conformidade: auditoria.status,
          legenda_tecnica: auditoria.detalhes
        }]);

        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', msg: `Sincronizado: ${file.name}` } : l));
        fetchData();
      } catch (err) {
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', msg: `Erro no processamento` } : l));
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-400 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#050505] border-r border-zinc-900/50 p-6 flex flex-col gap-8 shadow-2xl">
        <div className="flex items-center gap-3 py-4">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <h1 className="text-xl font-black text-white italic tracking-tighter">MAXIMUS <span className="text-green-500 text-[10px] not-italic tracking-widest ml-1">PhD</span></h1>
        </div>
        <nav className="flex flex-col gap-2">
          <button className="flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest"><HardHat size={18}/> Auditoria Técnica</button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest"><Camera size={18}/> Relatório de Fotos</button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest"><Scale size={18}/> Processos SEMAS</button>
        </nav>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.04)_0%,_transparent_50%)]">
        <header className="p-8 border-b border-zinc-900/50 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <Building2 className="text-green-500" size={28}/>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[2px]">Cardoso & Rates Engenharia</h2>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[3px]">Sistema de Gestão Ambiental</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
            <input 
              className="bg-black border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-[11px] w-[350px] focus:border-green-500 outline-none transition-all"
              placeholder="Pesquisar por placa ou documento..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </header>

        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          {/* DROP ZONE */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-zinc-900/5 border-2 border-dashed border-zinc-800/80 p-12 rounded-[2.5rem] text-center hover:border-green-500/40 transition-all cursor-pointer group shadow-2xl"
          >
            <UploadCloud size={50} className="mx-auto mb-4 text-zinc-800 group-hover:text-green-500 transition-all" />
            <h3 className="text-xs font-black text-white uppercase tracking-[5px]">Arraste os 13 Arquivos Aqui</h3>
            <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-[2px]">Detecção automática de Placas, Chassis e Isenções Inmetro</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* TABELA DE AUDITORIA */}
          <div className="bg-[#080808] border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-6">Documento</th>
                  <th className="p-6">Placa/Chassi</th>
                  <th className="p-6">Análise PhD</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/50 hover:bg-green-500/[0.01] group">
                    <td className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-zinc-900 rounded-xl text-zinc-700 group-hover:text-green-500 border border-zinc-800/50 transition-colors">
                        {doc.tipo_doc === 'PDF' ? <FileText size={20}/> : <FileSpreadsheet size={20}/>}
                      </div>
                      <span className="font-black text-white uppercase tracking-tighter truncate w-40">{doc.nome_arquivo}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-green-500 font-black tracking-widest bg-green-500/5 px-2 py-1 rounded border border-green-500/20">{doc.conteudo_extraido?.placa || "---"}</span>
                    </td>
                    <td className="p-6">
                       <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50 italic text-zinc-500">
                          {doc.legenda_tecnica || "Análise automática em processamento..."}
                       </div>
                    </td>
                    <td className="p-6 text-right">
                       <button className="p-2 hover:text-green-500"><Printer size={16}/></button>
                       <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchData(); }} className="p-2 hover:text-red-500"><Trash2 size={16}/></button>
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
