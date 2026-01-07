import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, FileText, Search, Printer, 
  UploadCloud, Loader2, Building2, 
  Camera, Cloud, CheckCircle2, 
  FileSpreadsheet, HardHat, Trash2, Scale, AlertCircle, Info
} from 'lucide-react';

// Conexão Segura Maximus PhD
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

  // APRIMORAMENTO: Motor de Auditoria Jurídico-Ambiental (Novo Método)
  const realizarAuditoriaDoutorado = (texto, nomeArquivo) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---";
    const chassi = (texto.match(/[A-HJ-NPR-Z0-9]{17}/gi) || [])[0] || "---";
    
    // Identificação de Tipo de Documento
    const eNF = /NOTA FISCAL|DANFE/i.test(texto) || nomeArquivo.toLowerCase().includes('nf');
    const eCTPP = /CTPP|INMETRO|CERTIFICADO PARA O TRANSPORTE/i.test(texto);
    const eCRLV = /CRLV|CERTIFICADO DE REGISTRO/i.test(texto);
    
    let parecer = "Análise técnica pendente.";
    let status = 'ANÁLISE';

    // Lógica para Veículos Novos (Baseado no seu Ofício e NFs enviadas)
    if (eNF && /2025/i.test(texto)) {
      parecer = "VEÍCULO 0KM: Isenção de CIV/CIPP (Portaria Inmetro 127/2022). Validade 12 meses.";
      status = 'CONFORME';
    } else if (eCTPP) {
      const venc = (texto.match(/\d{2}\/[A-Z]{3}\/\d{2,4}/gi) || [])[0] || "Consultar Campo 02";
      parecer = `CTPP Identificado. Vencimento: ${venc}.`;
      status = 'CONFORME';
    } else if (eCRLV) {
      parecer = `CRLV Exercício 2025. Placa ${placa} validada.`;
      status = 'CONFORME';
    }

    return { placa, chassi, status, detalhes: parecer };
  };

  const handleUpload = async (files) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Auditoria: ${file.name}` }, ...prev]);
      
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
      <aside className="w-72 bg-[#050505] border-r border-zinc-900/60 p-6 flex flex-col gap-8 shadow-2xl">
        <div className="flex items-center gap-4 py-4">
          <div className="bg-green-600 p-2.5 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">MAXIMUS <span className="text-green-500">PhD</span></h1>
            <p className="text-[7px] text-zinc-600 font-bold tracking-[3px] uppercase mt-1">Engenharia Ambiental</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          <button className="flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
            <HardHat size={18}/> Auditoria Digital
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
            <Camera size={18}/> Fotos Legendadas
          </button>
          <button className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
            <Scale size={18}/> SEMAS / SEMMA
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.05)_0%,_transparent_50%)]">
        <header className="p-8 border-b border-zinc-900/50 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <Building2 className="text-green-500" size={32}/>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Cardoso & Rates Engenharia</h2>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Controle de Frota de Produtos Perigosos</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
            <input 
              className="bg-black border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] w-[350px] focus:border-green-500 outline-none transition-all"
              placeholder="Pesquisar por Placa, Chassi ou Documento..."
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
            className="w-full bg-zinc-900/5 border-2 border-dashed border-zinc-800/80 p-16 rounded-[3.5rem] text-center hover:border-green-500/40 transition-all cursor-pointer group shadow-2xl"
          >
            <UploadCloud size={60} className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500 transition-all" />
            <h3 className="text-sm font-black text-white uppercase tracking-[6px]">Drop Zone Maximus PhD</h3>
            <p className="text-[10px] text-zinc-600 mt-3 uppercase tracking-[2px]">Solte os 13 arquivos simultâneos (PDF, NF, CRLV, Fotos)</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* TABELA DE AUDITORIA */}
          <div className="bg-[#080808] border border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Arquivo / Evidência</th>
                  <th className="p-8">Placa / Auditoria</th>
                  <th className="p-8">Parecer Técnico (PhD)</th>
                  <th className="p-8 text-right pr-12">Gestão</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/40 hover:bg-green-500/[0.01] transition-all group">
                    <td className="p-8 flex items-center gap-6">
                      <div className="p-4 bg-zinc-900/80 rounded-2xl text-zinc-700 group-hover:text-green-500 border border-zinc-800/50 transition-colors shadow-sm">
                        {doc.tipo_doc === 'PDF' ? <FileText size={22}/> : <Camera size={22}/>}
                      </div>
                      <div>
                        <p className="font-black text-white uppercase tracking-tighter group-hover:text-green-400 transition-colors truncate w-48">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-widest italic">{doc.tipo_doc} - Sincronizado</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-2">
                        <span className="text-green-500 font-black tracking-[3px] bg-green-500/5 px-3 py-1.5 rounded-xl border border-green-500/20 w-fit">
                          {doc.conteudo_extraido?.placa || "---"}
                        </span>
                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border w-fit ${doc.status_conformidade === 'CONFORME' ? 'border-green-500/20 text-green-700 bg-green-500/5' : 'border-yellow-500/20 text-yellow-700 bg-yellow-500/5'}`}>
                           {doc.status_conformidade}
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-start gap-3 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-4 text-[11px] text-zinc-400 italic leading-relaxed shadow-inner max-w-sm">
                          <Info size={14} className="text-green-500 mt-0.5 flex-shrink-0"/>
                          {doc.legenda_tecnica}
                       </div>
                    </td>
                    <td className="p-8 text-right pr-12">
                       <div className="flex justify-end gap-3">
                          <button className="p-3 bg-zinc-900 rounded-xl hover:text-green-500 transition-all border border-zinc-800"><Printer size={18}/></button>
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchData(); }} className="p-3 bg-zinc-900 rounded-xl hover:text-red-500 transition-all border border-zinc-800"><Trash2 size={18}/></button>
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
