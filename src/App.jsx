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
  Fingerprint // Ícone para representar o Chassi/Digital do carro
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

  // FUNÇÃO PHD: Extrai Placas e Chassis usando Expressões Regulares (Regex)
  const extrairDadosVeiculo = (texto) => {
    // Regex para Placa (Antiga: AAA-0000 e Mercosul: AAA0A00)
    const placaRegex = /[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi;
    // Regex para Chassi (Padrão 17 caracteres)
    const chassiRegex = /[A-HJ-NPR-Z0-9]{17}/gi;

    const placasEncontradas = texto.match(placaRegex) || [];
    const chassisEncontrados = texto.match(chassiRegex) || [];

    return {
      placa: placasEncontradas[0] || "Não detectada",
      chassi: chassisEncontrados[0] || "Não detectado"
    };
  };

  const fetchDocs = async () => {
    try {
      const { data } = await supabase
        .from('documentos_processados')
        .select('*')
        .order('data_leitura', { ascending: false })
        .limit(10);
      if (data) setDocs(data);
    } catch (err) {
      console.error("Erro na busca:", err);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      setLogs(prev => [{ status: 'loading', msg: `Analisando: ${file.name}` }, ...prev]);
      const ext = file.name.split('.').pop().toLowerCase();
      let text = "";

      try {
        // Processamento de arquivo (PDF, Excel, Word)
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

        // Executa a Inteligência de Extração
        const dados = extrairDadosVeiculo(text);

        // Salva no Supabase com os novos campos extraídos
        const { error } = await supabase.from('documentos_processados').insert([{
          nome_arquivo: file.name,
          tipo_doc: ext.toUpperCase(),
          conteudo_extraido: { 
            resumo: text.substring(0, 500),
            placa: dados.placa.toUpperCase(),
            chassi: dados.chassi.toUpperCase()
          },
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4'
        }]);

        if (error) throw error;
        setLogs(prev => [{ status: 'success', msg: `Placa ${dados.placa} identificada!` }, ...prev]);
        fetchDocs();

      } catch (err) {
        setLogs(prev => [{ status: 'error', msg: `Erro: ${err.message}` }, ...prev]);
      }
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER ESTATÍSTICO */}
        <header className="flex justify-between items-end mb-12 border-b border-zinc-900 pb-10">
          <div className="flex items-center gap-6">
            <div className="bg-green-500/10 p-4 rounded-3xl border border-green-500/20">
              <ShieldCheck className="text-green-500" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Maximus PhD</h1>
              <p className="text-[10px] font-bold text-zinc-500 tracking-[5px] uppercase">Auditoria de Frota & Ofícios</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-zinc-600 font-mono uppercase">Database Connection</p>
            <p className="text-xs text-green-500 font-bold">SUPABASE_ACTIVE_STABLE</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* PAINEL LATERAL: UPLOAD E LOGS */}
          <div className="lg:col-span-1 space-y-6">
            <div 
              onClick={() => document.getElementById('fIn').click()}
              className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 p-10 rounded-[2.5rem] text-center hover:border-green-500/40 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500" size={48} />
              <span className="text-sm font-bold text-white">Novo Documento</span>
              <input id="fIn" type="file" multiple className="hidden" onChange={handleUpload} />
            </div>

            <div className="bg-black border border-zinc-900 rounded-[2rem] p-6 h-[400px] flex flex-col">
              <h3 className="text-[10px] font-black text-zinc-700 mb-4 tracking-widest uppercase">Atividade do Auditor</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {logs.map((log, i) => (
                  <div key={i} className="text-[11px] p-3 bg-zinc-900/50 rounded-xl border border-white/5 flex gap-2">
                    {log.status === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> : <Loader2 size={14} className="text-yellow-500 animate-spin" />}
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL CENTRAL: LISTAGEM INTELIGENTE */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900/10 border border-zinc-800 rounded-[3rem] p-8 h-full min-h-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Search size={20} className="text-green-500" />
                  Resultados da Varredura
                </h2>
              </div>

              <div className="space-y-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-6 hover:border-green-500/30 transition-all">
                    <div className="flex gap-5">
                      <div className="bg-zinc-900 p-4 rounded-2xl text-zinc-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white truncate max-w-[200px] uppercase italic">{doc.nome_arquivo}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* DADOS EXTRAÍDOS EM DESTAQUE */}
                    <div className="flex gap-4">
                      <div className="bg-black border border-zinc-800 px-4 py-2 rounded-xl flex flex-col items-center min-w-[100px]">
                        <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Placa</span>
                        <span className="text-xs font-black text-green-500 font-mono">{doc.conteudo_extraido?.placa || "---"}</span>
                      </div>
                      <div className="bg-black border border-zinc-800 px-4 py-2 rounded-xl flex flex-col items-center min-w-[140px]">
                        <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Chassi</span>
                        <span className="text-[10px] font-black text-zinc-400 font-mono uppercase truncate w-[120px] text-center">
                          {doc.conteudo_extraido?.chassi || "---"}
                        </span>
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
