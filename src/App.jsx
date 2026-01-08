import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Search, UploadCloud, Loader2, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

// ARQUITETURA CRÍTICA: As chaves são lidas do ambiente do Vercel
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Carregamento Seguro do PDF.js (Prevenção de erro #418 no Build)
  const loadPdfEngine = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);
    return new Promise(res => {
      script.onload = () => {
        const engine = window['pdfjs-dist/build/pdf'];
        engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        res(engine);
      };
    });
  };

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  const handleProcess = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    const pdf = await loadPdfEngine();

    for (const f of files) {
      try {
        let content = f.name;
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await f.arrayBuffer();
          const doc = await pdf.getDocument({ data: buffer }).promise;
          let text = "";
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const raw = await page.getTextContent();
            text += raw.items.map(s => s.str).join(" ") + " ";
          }
          content = text;
        }

        // MOTOR DE AUDITORIA PHD (Identifica Portarias de Marabá)
        const placa = (content.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        let info = { status: 'NORMAL', msg: 'Documento auditado.' };

        if (/127\/2022/i.test(content)) info = { status: 'CONFORME', msg: 'ISENÇÃO 0KM (PORTARIA 127)' };
        if (/15793/i.test(content)) info = { status: 'CONFORME', msg: 'PROCESSO LO 15793/2025' };
        if (/A073|CTPP/i.test(content)) info = { status: 'ALERTA', msg: 'CTPP NOVO: 1ª INSPEC. 07/2026' };

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: info.status },
          status_conformidade: info.status,
          legenda_tecnica: info.msg
        }]);
      } catch (err) { console.error(err); }
    }
    fetchDocs();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans p-6">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 bg-black p-6 rounded-3xl border border-zinc-900 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-2.5 rounded-xl"><ShieldCheck size={24} className="text-black" /></div>
          <h1 className="text-xl font-black text-white tracking-tighter">MAXIMUS <span className="text-green-500">PHD</span></h1>
        </div>
        <div className="flex gap-4">
          <input 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 focus:border-green-500 outline-none" 
            placeholder="Filtrar auditoria..." 
            onChange={e => setBusca(e.target.value)}
          />
          <button onClick={() => inputRef.current.click()} className="bg-white text-black font-black px-6 py-2 rounded-xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-500 transition-all">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {loading ? "Processando" : "Auditar"}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid gap-4">
        {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map(doc => (
          <div key={doc.id} className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center group hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="font-mono bg-black px-3 py-1 rounded border border-zinc-800 text-white text-xs">{doc.conteudo_extraido?.placa}</div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase">{doc.nome_arquivo}</h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1 tracking-widest">{doc.legenda_tecnica}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={18} className="text-yellow-600" /> : <CheckCircle size={18} className="text-green-600" />}
              <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchDocs(); }} className="p-2 opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </main>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleProcess} />
    </div>
  );
}
