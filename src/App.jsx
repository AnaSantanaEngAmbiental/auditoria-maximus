import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, 
  Loader2, Trash2, FileSearch, Database, CheckCircle, AlertTriangle
} from 'lucide-react';

// 1. CONFIGURAÇÃO SUPABASE (Busca as chaves do cofre do Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 2. CARREGAMENTO DO MOTOR DE PDF (Evita erro de build #418)
  const loadPdfLib = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);
    return new Promise((res) => {
      script.onload = () => {
        const engine = window['pdfjs-dist/build/pdf'];
        engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        res(engine);
      };
    });
  };

  useEffect(() => { fetchDatabase(); }, []);

  async function fetchDatabase() {
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // 3. PROCESSAMENTO DE ARQUIVOS E AUDITORIA
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    const pdfLib = await loadPdfLib();

    for (const f of files) {
      try {
        let textContent = f.name;
        
        // Leitura do PDF
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await f.arrayBuffer();
          const pdfDoc = await pdfLib.getDocument({ data: buffer }).promise;
          let pagesText = "";
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const content = await page.getTextContent();
            pagesText += content.items.map(s => s.str).join(" ") + " ";
          }
          textContent = pagesText;
        }

        // LÓGICA DE AUDITORIA PHD (Específica para Cardoso & Rates)
        const placa = (textContent.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        let analise = { status: 'NORMAL', msg: 'Documento auditado com sucesso.' };

        if (/127\/2022/i.test(textContent) || /0 ?KM/i.test(textContent)) {
          analise = { status: 'CONFORME', msg: 'ISENTO (PORTARIA 127/2022): Veículo 0km.' };
        } else if (/15793/i.test(textContent) || /2025\/0000036005/i.test(textContent)) {
          analise = { status: 'CONFORME', msg: 'LO 15793: Vinculado ao processo de Marabá.' };
        } else if (/A073|CTPP/i.test(textContent)) {
          analise = { status: 'ALERTA', msg: 'CTPP CONSTRUÇÃO: Vistoria programada p/ Julho/2026.' };
        }

        // Envio para o Supabase
        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: analise.status },
          status_conformidade: analise.status,
          legenda_tecnica: analise.msg
        }]);

      } catch (err) {
        console.error("Erro no processamento pericial:", err);
      }
    }
    
    await fetchDatabase();
    setLoading(false);
  };

  const docsFiltrados = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.includes(busca.toUpperCase())
    );
  }, [docs, busca]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans print:bg-white print:text-black">
      
      {/* HEADER CORPORATIVO (Oculto na impressão) */}
      <header className="h-20 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-600 rounded-lg">
            <ShieldCheck size={22} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase leading-none">MAXIMUS <span className="text-green-500 italic">PHD</span></h1>
            <span className="text-[9px] text-zinc-600 font-bold tracking-[3px] uppercase">Controle de Frota • Marabá</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input 
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-12 pr-6 text-xs w-72 outline-none focus:border-green-500 transition-all text-white placeholder:text-zinc-800"
              placeholder="Buscar placa ou termo..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-white hover:bg-green-500 text-black font-black px-6 py-2.5 rounded-xl text-[10px] uppercase transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
            {loading ? "Processando..." : "Auditar Docs"}
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-black px-4 py-2.5 rounded-xl text-[10px] uppercase transition-all border border-zinc-800 flex items-center gap-2"
          >
            <Printer size={14}/>
            Relatório
          </button>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <main className="p-8 max-w-[1500px] mx-auto">
        <div className="flex items-center justify-between mb-10 print:mb-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight print:text-black">Relatório de Conformidade</h2>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[4px] mt-1">Unidade Operacional Marabá - PA</p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-3 print:hidden">
            <Database size={16} className="text-green-600" />
            <span className="text-xs font-bold text-white uppercase">{docs.length} <span className="text-zinc-600 ml-1">Docs Sincronizados</span></span>
          </div>
        </div>

        {/* TABELA DE ALTA PERFORMANCE */}
        <div className="bg-black border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl print:border-none print:bg-white">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/20 text-[10px] font-black text-zinc-700 uppercase tracking-widest border-b border-zinc-900 print:bg-zinc-100">
              <tr>
                <th className="p-6">Documento</th>
                <th className="p-6 text-center">Placa</th>
                <th className="p-6">Parecer Técnico Cardoso & Rates</th>
                <th className="p-6 text-right pr-10 print:hidden">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {docsFiltrados.map((doc) => (
                <tr key={doc.id} className="hover:bg-green-500/[0.01] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-green-500/30 print:hidden">
                        <FileSearch size={18} className="text-zinc-600"/>
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase truncate max-w-xs print:text-black">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-800 font-bold uppercase mt-1 italic">{new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-zinc-900 border border-zinc-800 text-white px-4 py-1.5 rounded-lg font-black tracking-widest text-xs print:text-black print:border-zinc-300">
                      {doc.conteudo_extraido?.placa || "---"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-green-500/5 border-green-500/10'} print:border-none print:p-0`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} className="text-yellow-600 mt-0.5" /> : <CheckCircle size={14} className="text-green-700 mt-0.5"/>}
                      <p className={`text-[11px] font-medium leading-relaxed italic uppercase ${doc.status_conformidade === 'ALERTA' ? 'text-yellow-600/80' : 'text-zinc-500'} print:text-black`}>
                        {doc.legenda_tecnica}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 text-right pr-10 print:hidden">
                    <button 
                      onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchDatabase(); }}
                      className="p-2.5 bg-zinc-900 hover:text-red-500 rounded-lg border border-zinc-800 opacity-20 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {docs.length === 0 && (
            <div className="py-40 text-center">
              <Database size={40} className="mx-auto text-zinc-900 mb-4" />
              <p className="text-[10px] text-zinc-800 uppercase font-black tracking-[10px]">Aguardando Fluxo Operacional</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />

      <footer className="fixed bottom-0 w-full h-8 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-widest print:hidden">
        <span>Engenharia de Frota • Marabá-PA</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          <span>Cloud Sync Ativo</span>
        </div>
      </footer>
    </div>
  );
}
