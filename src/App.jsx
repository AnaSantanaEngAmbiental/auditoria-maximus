import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, 
  Loader2, Trash2, FileSearch, Database, CheckCircle, AlertTriangle, FileText
} from 'lucide-react';

// CONFIGURAÇÃO SUPABASE: Segurança via Environment Variables do Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // MOTOR DE PDF: Carregamento assíncrono para evitar erro #418 no Vercel
  const loadPdfEngine = async () => {
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

  useEffect(() => { carregarBanco(); }, []);

  async function carregarBanco() {
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  const handleUploadMassa = async (e) => {
    const arquivos = Array.from(e.target.files);
    setLoading(true);
    const pdf = await loadPdfEngine();

    for (const arq of arquivos) {
      try {
        let textoBruto = arq.name;
        
        if (arq.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await arq.arrayBuffer();
          const docPdf = await pdf.getDocument({ data: buffer }).promise;
          let stringPaginas = "";
          for (let i = 1; i <= docPdf.numPages; i++) {
            const pagina = await docPdf.getPage(i);
            const conteudo = await pagina.getTextContent();
            stringPaginas += conteudo.items.map(s => s.str).join(" ") + " ";
          }
          textoBruto = stringPaginas;
        }

        // INTELIGÊNCIA PERICIAL (Foco Marabá)
        const placaIdentificada = (textoBruto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        let parecerFinal = { status: 'NORMAL', msg: 'Documento verificado e arquivado.' };

        // Regras de Ouro Cardoso & Rates
        if (/127\/2022/i.test(textoBruto) || /0 ?KM/i.test(textoBruto)) {
          parecerFinal = { status: 'CONFORME', msg: 'ISENÇÃO (PORTARIA 127/22): Veículo 0km - Dispensado de CIV.' };
        } else if (/15793/i.test(textoBruto) || /2025\/0000036005/i.test(textoBruto)) {
          parecerFinal = { status: 'CONFORME', msg: 'LICENÇA OPERAÇÃO: Vinculado à LO 15793/2025 (SEMAS).' };
        } else if (/A073|CTPP/i.test(textoBruto)) {
          parecerFinal = { status: 'ALERTA', msg: 'CTPP CONSTRUÇÃO: Tanque novo. Primeira inspeção em Julho/2026.' };
        }

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: arq.name,
          tipo_doc: arq.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa: placaIdentificada, status: parecerFinal.status },
          status_conformidade: parecerFinal.status,
          legenda_tecnica: parecerFinal.msg
        }]);

      } catch (err) {
        console.error("Erro crítico no arquivo:", arq.name, err);
      }
    }
    
    await carregarBanco();
    setLoading(false);
  };

  const docsFiltrados = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.includes(busca.toUpperCase())
    );
  }, [docs, busca]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-green-500/30 print:bg-white">
      
      {/* HEADER: Oculto na Impressão */}
      <header className="h-20 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 shadow-2xl print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-600 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <ShieldCheck size={22} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase leading-none">MAXIMUS <span className="text-green-500 italic">PHD</span></h1>
            <span className="text-[9px] text-zinc-600 font-bold tracking-[3px] uppercase">Cardoso & Rates • Marabá</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input 
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-12 pr-6 text-xs w-72 outline-none focus:border-green-500 transition-all text-white placeholder:text-zinc-800"
              placeholder="Placa ou documento..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className="bg-white hover:bg-green-500 text-black font-black px-6 py-2.5 rounded-xl text-[10px] uppercase transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
            {loading ? "Auditando..." : "Subir Documentos"}
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="p-8 max-w-[1500px] mx-auto">
        <div className="flex items-center justify-between mb-10 print:mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight print:text-black print:text-xl">Auditoria de Conformidade Ambiental</h2>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[4px] mt-1 print:text-zinc-500">Engenharia de Frota • Cardoso & Rates</p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-3 print:hidden">
            <FileText size={16} className="text-green-600" />
            <span className="text-xs font-bold text-white uppercase">{docs.length} <span className="text-zinc-600 ml-1">Arquivos</span></span>
          </div>
        </div>

        {/* TABELA PERICIAL */}
        <div className="bg-black border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl print:border-zinc-200 print:rounded-none">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-900/20 text-[10px] font-black text-zinc-700 uppercase tracking-widest border-b border-zinc-900 print:bg-zinc-50 print:text-zinc-600">
              <tr>
                <th className="p-6">Documento</th>
                <th className="p-6 text-center">Identificação</th>
                <th className="p-6">Parecer Técnico da Auditoria</th>
                <th className="p-6 text-right pr-10 print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50 print:divide-zinc-200">
              {docsFiltrados.map((doc) => (
                <tr key={doc.id} className="group hover:bg-green-500/[0.01] transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 print:hidden">
                        <FileSearch size={18} className="text-zinc-600"/>
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase truncate max-w-xs print:text-black">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-800 font-bold uppercase mt-1 italic print:text-zinc-400">Auditoria: {new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-zinc-900 border border-zinc-800 text-white px-4 py-1.5 rounded-lg font-black tracking-widest text-xs print:text-black print:border-zinc-300 print:bg-zinc-50">
                      {doc.conteudo_extraido?.placa || "FROTA"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-green-500/5 border-green-500/10'} print:border-none print:p-0`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} className="text-yellow-700 mt-0.5" /> : <CheckCircle size={14} className="text-green-700 mt-0.5"/>}
                      <p className={`text-[11px] font-medium leading-relaxed italic uppercase ${doc.status_conformidade === 'ALERTA' ? 'text-yellow-600/80' : 'text-zinc-500'} print:text-black print:text-[10px]`}>
                        {doc.legenda_tecnica}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 text-right pr-10 print:hidden">
                    <button 
                      onClick={async () => { if(confirm('Excluir auditoria?')) { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarBanco(); } }}
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
              <p className="text-[10px] text-zinc-800 uppercase font-black tracking-[10px]">Aguardando Processamento de Marabá</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadMassa} />

      {/* FOOTER: Oculto na Impressão */}
      <footer className="fixed bottom-0 w-full h-8 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-widest print:hidden">
        <span>Sistema Maximus PhD • Cardoso & Rates Engenharia</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          <span>Unidade Marabá Online</span>
        </div>
      </footer>
    </div>
  );
}
