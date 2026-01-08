import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, 
  Loader2, Trash2, FileSearch, Database, CheckCircle, AlertTriangle
} from 'lucide-react';

// ARQUITETURA CRÍTICA: Busca do "Cofre" do Vercel
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // PREVENÇÃO DE ERRO #418: Carrega o motor de PDF apenas no navegador
  const getPdfEngine = async () => {
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

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  const processarUpload = async (e) => {
    const arquivos = Array.from(e.target.files);
    setLoading(true);
    const pdfLib = await getPdfEngine();

    for (const arq of arquivos) {
      try {
        let textoExtraido = arq.name;
        if (arq.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await arq.arrayBuffer();
          const pdf = await pdfLib.getDocument({ data: buffer }).promise;
          let tempText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            tempText += content.items.map(s => s.str).join(" ") + " ";
          }
          textoExtraido = tempText;
        }

        // INTELIGÊNCIA DE AUDITORIA (Base Marabá)
        const placa = (textoExtraido.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        let analise = { status: 'NORMAL', msg: 'Documento processado.' };

        if (/127\/2022/i.test(textoExtraido)) analise = { status: 'CONFORME', msg: 'ISENÇÃO 0KM (Portaria 127/22)' };
        else if (/15793/i.test(textoExtraido)) analise = { status: 'CONFORME', msg: 'VINCULADO LO 15793 (SEMAS)' };
        else if (/A073|CTPP/i.test(textoExtraido)) analise = { status: 'ALERTA', msg: 'CTPP NOVO: Insp. Julho/2026' };

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: arq.name,
          tipo_doc: arq.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: analise.status },
          status_conformidade: analise.status,
          legenda_tecnica: analise.msg
        }]);
      } catch (err) { console.error("Falha técnica:", err); }
    }
    carregarDados();
    setLoading(false);
  };

  const filtrados = useMemo(() => docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())), [docs, busca]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-green-500/30">
      <header className="h-20 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-600 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]">
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
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-12 pr-6 text-xs w-80 outline-none focus:border-green-500 transition-all text-white placeholder:text-zinc-800"
              placeholder="Pesquisar auditoria..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-white hover:bg-green-500 text-black font-black px-6 py-2.5 rounded-xl text-[10px] uppercase transition-all flex items-center gap-2 shadow-xl"
          >
            {loading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
            {loading ? "Auditando..." : "Subir Documentos"}
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1500px] mx-auto">
        <div className="bg-black border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/20 text-[10px] font-black text-zinc-700 uppercase tracking-widest border-b border-zinc-900">
              <tr>
                <th className="p-6">Documento Extraído</th>
                <th className="p-6 text-center">Placa</th>
                <th className="p-6">Parecer da Auditoria</th>
                <th className="p-6 text-right pr-10">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {filtrados.map((doc) => (
                <tr key={doc.id} className="hover:bg-green-500/[0.01] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-green-500/30 transition-all">
                        <FileSearch size={18} className="text-zinc-600 group-hover:text-green-500"/>
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase truncate max-w-sm">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-800 font-bold uppercase mt-1 italic">{new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-zinc-900 border border-zinc-800 text-white px-4 py-1.5 rounded-lg font-black tracking-widest text-xs shadow-inner">
                      {doc.conteudo_extraido?.placa || "---"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-green-500/5 border-green-500/10'}`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} className="text-yellow-700 mt-0.5" /> : <CheckCircle size={14} className="text-green-700 mt-0.5"/>}
                      <p className={`text-[11px] font-medium leading-relaxed italic uppercase ${doc.status_conformidade === 'ALERTA' ? 'text-yellow-600/70' : 'text-zinc-500'}`}>
                        {doc.legenda_tecnica}
                      </p>
                    </div>
                  </td>
                  <td className="p-6 text-right pr-10">
                    <button 
                      onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }}
                      className="p-2.5 bg-zinc-900 hover:text-red-500 rounded-lg border border-zinc-800 opacity-20 group-hover:opacity-100 transition-all"
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
              <p className="text-[10px] text-zinc-800 uppercase font-black tracking-[10px]">Base Marabá em espera</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={processarUpload} />
    </div>
  );
}
