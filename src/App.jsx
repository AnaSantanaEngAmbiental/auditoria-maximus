import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { 
  UploadCloud, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Loader2,
  Search,
  Activity
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchDocs();
  }, []);

  // INTELIGÊNCIA MAXIMUS: Padrões de Placa e Chassi
  const extrairDadosVeiculo = (texto) => {
    const placaRegex = /[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi;
    const chassiRegex = /[A-HJ-NPR-Z0-9]{17}/gi;
    const placas = texto.match(placaRegex) || [];
    const chassis = texto.match(chassiRegex) || [];
    return {
      placa: placas[0] || "N/A",
      chassi: chassis[0] || "N/A"
    };
  };

  const fetchDocs = async () => {
    try {
      const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false }).limit(15);
      if (data) setDocs(data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Auditoria iniciada: ${file.name}` }, ...prev]);
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
        }

        const dados = extrairDadosVeiculo(text);

        await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { 
            resumo: text.substring(0, 300),
            placa: dados.placa.toUpperCase(),
            chassi: dados.chassi.toUpperCase()
          },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        setLogs(prev => [{ status: 'success', msg: `Identificado: ${dados.placa}` }, ...prev]);
        fetchDocs();
      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro no arquivo ${file.name}` }, ...prev]);
      }
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* BARRA SUPERIOR SLIM */}
        <header className="flex items-center justify-between mb-8 bg-zinc-900/30 p-6 rounded-[2rem] border border-zinc-800">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-green-500" size={32} />
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Maximus PhD</h1>
              <p className="text-[9px] tracking-[3px] text-zinc-600 font-bold uppercase">Engine v3.3</p>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <p className="text-[10px] text-zinc-600 font-mono">SUPABASE CLOUD</p>
              <p className="text-[10px] text-green-500 font-bold">CONECTADO</p>
            </div>
            <Activity className="text-zinc-800" size={20} />
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          
          {/* LADO ESQUERDO: CONTROLES (COL 3) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div 
              onClick={() => document.getElementById('fIn').click()}
              className="bg-green-500/5 border-2 border-dashed border-green-500/20 p-8 rounded-[2.5rem] text-center hover:bg-green-500/10 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-3 text-green-500/50 group-hover:scale-110 transition-transform" size={40} />
              <p className="text-xs font-bold text-white uppercase italic">Importar Ofício</p>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] p-5 h-[400px] overflow-hidden flex flex-col">
              <h3 className="text-[10px] font-black text-zinc-700 mb-4 tracking-widest uppercase px-2">Monitoramento</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="text-[10px] p-3 bg-black/40 rounded-xl border border-zinc-800 flex gap-3 items-center">
                    {log.status === 'success' ? <CheckCircle2 size={12} className="text-green-500" /> : <Loader2 size={12} className="text-yellow-500 animate-spin" />}
                    <span className="truncate">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: DADOS (COL 9) */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-zinc-900/10 border border-zinc-800 rounded-[2.5rem] p-6 min-h-[600px]">
              <div className="flex items-center gap-3 mb-6 px-4">
                <Search size={18} className="text-green-500" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Base de Auditoria Ativa</h2>
              </div>

              {/* TABELA DE DADOS EXPANDIDA */}
              <div className="grid grid-cols-1 gap-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-4 hover:border-green-500/30 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                      <div className="bg-zinc-900 p-3 rounded-xl text-zinc-600">
                        <FileText size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-white truncate uppercase italic">{doc.nome_arquivo}</h4>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* BOX PLACA */}
                      <div className="bg-black px-4 py-2 rounded-xl border border-zinc-800 flex flex-col items-center">
                        <span className="text-[8px] text-zinc-700 font-bold uppercase">Placa</span>
                        <span className="text-[11px] font-black text-green-500 font-mono tracking-wider">
                          {doc.conteudo_extraido?.placa || "N/A"}
                        </span>
                      </div>
                      
                      {/* BOX CHASSI */}
                      <div className="bg-black px-4 py-2 rounded-xl border border-zinc-800 flex flex-col items-center">
                        <span className="text-[8px] text-zinc-700 font-bold uppercase">Chassi</span>
                        <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase">
                          {doc.conteudo_extraido?.chassi?.substring(0, 10)}...
                        </span>
                      </div>

                      {/* STATUS */}
                      <div className="px-3 py-1 rounded-full border border-green-500/10 bg-green-500/5 text-[9px] font-black text-green-500/40 uppercase hidden sm:block">
                        Validado
                      </div>
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
