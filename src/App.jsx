import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, 
  Loader2, Trash2, FileSearch, Database, CheckCircle, AlertTriangle
} from 'lucide-react';

// ACESSO SEGURO: O sistema busca as chaves configuradas no Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// REGRAS TÉCNICAS (Sincronizado com documentos de Marabá)
const REGRAS_MARABA = [
  { id: 'p127', regex: /127\/2022/i, desc: 'ISENÇÃO 0KM (PORTARIA 127): Veículo novo isento de CIV.', status: 'CONFORME' },
  { id: 'lo15', regex: /15793/i, desc: 'LO 15793: Vinculado ao processo SEMAS 2025/0000036005.', status: 'CONFORME' },
  { id: 'ctpp', regex: /A073|CTPP/i, desc: 'CTPP CONSTRUÇÃO: Tanque novo. 1ª inspeção em Julho/2026.', status: 'ALERTA' }
];

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const inputRef = useRef(null);

  // Carregamento Lazy (Preguiçoso) do PDF.js para não quebrar o Build
  const carregarPdfLib = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);
    return new Promise(resolve => {
      script.onload = () => {
        const lib = window['pdfjs-dist/build/pdf'];
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      };
    });
  };

  useEffect(() => { syncDados(); }, []);

  async function syncDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setAnalisando(true);
    const pdfLib = await carregarPdfLib();

    for (const f of files) {
      try {
        let textoFinal = f.name;
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await f.arrayBuffer();
          const doc = await pdfLib.getDocument({ data: buffer }).promise;
          let extraido = "";
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            extraido += content.items.map(s => s.str).join(" ") + " ";
          }
          textoFinal = extraido;
        }

        const placa = (textoFinal.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        const regra = REGRAS_MARABA.find(r => r.regex.test(textoFinal));

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: regra?.status || 'PADRÃO' },
          status_conformidade: regra?.status || 'AUDITADO',
          legenda_tecnica: regra?.desc || 'Documento auditado sem alertas específicos.'
        }]);
      } catch (err) { console.error("Erro no processamento:", err); }
    }
    await syncDados();
    setAnalisando(false);
  };

  const lista = useMemo(() => docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())), [docs, busca]);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 p-4 md:p-8">
      {/* HEADER TECH */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-600 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">MAXIMUS <span className="text-green-500 italic">PHD</span></h1>
            <p className="text-[10px] font-bold text-zinc-600 tracking-[4px] uppercase">Cardoso & Rates • Marabá</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
            <input 
              className="w-full md:w-80 bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:border-green-500 outline-none transition-all"
              placeholder="Buscar placa..."
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={() => inputRef.current.click()}
            className="bg-white hover:bg-green-500 text-black font-black px-8 py-3 rounded-2xl text-xs uppercase transition-all flex items-center gap-2"
          >
            {analisando ? <Loader2 className="animate-spin" size={16}/> : <UploadCloud size={16}/>}
            {analisando ? "Lendo..." : "Upload"}
          </button>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] uppercase font-black tracking-widest text-zinc-600">
                <th className="p-8">Arquivo</th>
                <th className="p-8">Placa</th>
                <th className="p-8">Auditoria Automática</th>
                <th className="p-8 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {lista.map(doc => (
                <tr key={doc.id} className="group hover:bg-white/[0.01]">
                  <td className="p-8 text-sm font-bold text-zinc-300 uppercase">{doc.nome_arquivo}</td>
                  <td className="p-8">
                    <span className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-white font-mono font-black tracking-tighter shadow-xl">
                      {doc.conteudo_extraido?.placa}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={16} className="text-yellow-600" /> : <CheckCircle size={16} className="text-green-600" />}
                      <span className="text-[11px] font-medium italic text-zinc-500">{doc.legenda_tecnica}</span>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); syncDados(); }} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
}
