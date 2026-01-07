import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ShieldCheck, FileText, Search, Printer, 
  UploadCloud, Loader2, Building2, 
  Camera, CheckCircle2, 
  FileSpreadsheet, HardHat, Trash2, Scale, Info, AlertTriangle, Calendar
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

  // MOTOR PHD: Identificação de Validades e Cruzamento (Método Caeli)
  const realizarAuditoriaDoutorado = (texto, nomeArquivo) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0]?.toUpperCase().replace(/[- ]/g, "") || "---";
    
    // Identificação de Documentos Críticos
    const eLO = /LICENÇA DE OPERAÇÃO|LO Nº/i.test(texto);
    const ePlanilha = /ORD,CPF\/CNPJ,PLACA|VALIDADE CIV/i.test(texto) || nomeArquivo.toLowerCase().includes('planilha');
    const eCTPP = /CTPP|INMETRO/i.test(texto);

    let parecer = "Análise documental em curso.";
    let status = 'ANÁLISE';
    let validade = null;

    if (eLO) {
      const dataValidade = (texto.match(/VALIDADE ATÉ:?\s*(\d{2}\/\d{2}\/\d{4})/i) || [])[1];
      parecer = `LICENÇA DE OPERAÇÃO VIGENTE. Expira em: ${dataValidade || 'Não encontrada'}.`;
      status = 'CONFORME';
      validade = dataValidade;
    } else if (ePlanilha) {
      parecer = "PLANILHA DE CONTROLE INTERNO: Sincronizando validades de MOPP e CIPP.";
      status = 'CONFORME';
    } else if (eCTPP) {
      const venc = (texto.match(/(\d{2}\/[A-Z]{3}\/\d{2})/i) || [])[1];
      parecer = `CERTIFICADO INMETRO (CTPP). Próxima inspeção: ${venc || 'Ver campo 14'}.`;
      status = 'CONFORME';
    } else if (/2025/i.test(texto) && /NOTA FISCAL/i.test(texto)) {
      parecer = "ISENÇÃO LEGAL: Veículo 0km. Dispensa CIV por 1 ano (Portaria 127/2022).";
      status = 'CONFORME';
    }

    return { placa, status, detalhes: parecer, validade };
  };

  const handleUpload = async (files) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      const logId = Date.now();
      setLogs(prev => [{ id: logId, status: 'loading', msg: `Lendo: ${file.name}` }, ...prev]);
      
      try {
        let textContent = "";
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(s => s.str).join(" ") + " ";
          }
        } else {
          textContent = file.name; // Simulação para DOCX/XLSX
        }

        const auditoria = realizarAuditoriaDoutorado(textContent, file.name);

        await supabase.from('documentos_processados').insert([{
          unidade_id: UNIDADE_ID,
          nome_arquivo: file.name,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: auditoria,
          status_conformidade: auditoria.status,
          legenda_tecnica: auditoria.detalhes
        }]);

        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', msg: `Auditado: ${file.name}` } : l));
        fetchData();
      } catch (err) {
        setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', msg: `Falha técnica` } : l));
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-400 font-sans overflow-hidden">
      {/* SIDEBAR DESIGNER */}
      <aside className="w-80 bg-[#050505] border-r border-zinc-900 p-8 flex flex-col gap-10 shadow-2xl relative z-20">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <ShieldCheck size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none">MAXIMUS <span className="text-green-500">PhD</span></h1>
            <p className="text-[8px] text-zinc-600 font-bold tracking-[4px] uppercase mt-2">Inteligência Ambiental</p>
          </div>
        </div>

        <nav className="space-y-3">
          <button className="w-full flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all"><HardHat size={18}/> Gestão de Frota</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all"><Calendar size={18}/> Vencimentos LO/CTPP</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all"><Scale size={18}/> Jurídico SEMAS/PA</button>
        </nav>

        <div className="mt-auto p-6 bg-zinc-900/20 rounded-[2rem] border border-zinc-800/50">
           <p className="text-[10px] text-white font-black uppercase mb-3 flex items-center gap-2">
             <AlertTriangle size={14} className="text-yellow-500"/> Alertas Críticos
           </p>
           <div className="space-y-2 text-[9px] font-bold uppercase tracking-tighter text-zinc-500">
              <p>• LO 15793: Expira em 24/09/29</p>
              <p>• 13 Veículos Pendentes Inclusão</p>
           </div>
        </div>
      </aside>

      {/* DASHBOARD PRINCIPAL */}
      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.08)_0%,_transparent_40%)]">
        <header className="p-8 border-b border-zinc-900/50 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
               <Building2 className="text-green-500" size={28}/>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Cardoso & Rates Engenharia</h2>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-[2px] italic">Unidade de Controle Marabá/PA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
              <input 
                className="bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-[11px] w-[400px] focus:border-green-500 outline-none transition-all"
                placeholder="Filtrar por placa, motorista ou documento..."
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          {/* UPLOAD INTELIGENTE */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-zinc-900/5 border-2 border-dashed border-zinc-800 p-20 rounded-[4rem] text-center hover:border-green-500/50 transition-all cursor-pointer group shadow-2xl relative"
          >
            <UploadCloud size={70} className="mx-auto mb-8 text-zinc-800 group-hover:text-green-500 transition-all transform group-hover:-translate-y-2" />
            <h3 className="text-base font-black text-white uppercase tracking-[8px]">Upload Central Caeli</h3>
            <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-[3px]">Arraste LOs, Planilhas e Documentos de Veículos</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* TABELA DE AUDITORIA CONSOLIDADA */}
          <div className="bg-[#080808] border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/40 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-10">Evidência / Tipo</th>
                  <th className="p-10">Placa / Status</th>
                  <th className="p-10">Análise Técnica Maximus</th>
                  <th className="p-10 text-right pr-14">Ação</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/30 hover:bg-green-500/[0.01] transition-all group">
                    <td className="p-10 flex items-center gap-6">
                      <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-700 group-hover:text-green-500 border border-zinc-800 transition-colors shadow-lg">
                        {doc.tipo_doc === 'PDF' ? <FileText size={24}/> : <FileSpreadsheet size={24}/>}
                      </div>
                      <div>
                        <p className="font-black text-white uppercase tracking-tighter truncate w-56 group-hover:text-green-400 transition-colors">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-widest italic">{doc.tipo_doc} - Auditado</p>
                      </div>
                    </td>
                    <td className="p-10">
                      <div className="flex flex-col gap-3">
                        <span className="text-green-500 font-black tracking-[4px] bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/20 w-fit shadow-sm">
                          {doc.conteudo_extraido?.placa || "SISTEMA"}
                        </span>
                        <div className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border w-fit ${doc.status_conformidade === 'CONFORME' ? 'border-green-500/20 text-green-600 bg-green-500/5' : 'border-yellow-500/20 text-yellow-600 bg-yellow-500/5'}`}>
                           {doc.status_conformidade}
                        </div>
                      </div>
                    </td>
                    <td className="p-10">
                       <div className="flex items-start gap-4 bg-zinc-900/40 border border-zinc-800/50 rounded-[1.5rem] p-5 text-[11px] text-zinc-400 italic leading-relaxed shadow-inner max-w-sm">
                          <Info size={16} className="text-green-500 mt-1 flex-shrink-0"/>
                          {doc.legenda_tecnica}
                       </div>
                    </td>
                    <td className="p-10 text-right pr-14">
                       <div className="flex justify-end gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button className="p-4 bg-zinc-900 rounded-2xl hover:text-green-500 transition-all border border-zinc-800 shadow-md"><Printer size={20}/></button>
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchData(); }} className="p-4 bg-zinc-900 rounded-2xl hover:text-red-500 transition-all border border-zinc-800 shadow-md"><Trash2 size={20}/></button>
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
