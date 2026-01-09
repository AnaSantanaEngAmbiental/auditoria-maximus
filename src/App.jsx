import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  FileSearch, Database, CheckCircle, AlertTriangle, Lock, FileText, LayoutDashboard
} from 'lucide-react';

// 1. INFRAESTRUTURA CRÍTICA: Configuração Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  // Estados de Controle
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('FROTA'); // FROTA | CONDICIONANTES | LAUDOS
  const fileInputRef = useRef(null);

  // 2. MOTOR DE PDF (Lazy Loading para estabilidade Vercel)
  const getPdfEngine = async () => {
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

  useEffect(() => { if (autorizado) carregarDados(); }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // 3. AUDITORIA EM MASSA (Com Prevenção de Duplicidade)
  const processarArquivos = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    const pdf = await getPdfEngine();

    for (const f of files) {
      try {
        // Evitar duplicidade: Checar se o nome já existe na lista atual
        if (docs.some(d => d.nome_arquivo === f.name)) continue;

        let content = f.name;
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await f.arrayBuffer();
          const docPdf = await pdf.getDocument({ data: buffer }).promise;
          let text = "";
          for (let i = 1; i <= docPdf.numPages; i++) {
            const page = await docPdf.getPage(i);
            const raw = await page.getTextContent();
            text += raw.items.map(s => s.str).join(" ") + " ";
          }
          content = text;
        }

        // Inteligência Maximus PhD (Extração Marabá)
        const placa = (content.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
        let analise = { status: 'NORMAL', msg: 'Documento registrado.' };

        // Regras Periciais (LO 15793 / Portaria 127)
        if (/127\/2022/i.test(content)) analise = { status: 'CONFORME', msg: 'ISENTO (Portaria 127/22): Veículo 0km.' };
        else if (/15793/i.test(content)) analise = { status: 'CONFORME', msg: 'LO 15793: Vinculado à Licença de Operação.' };
        else if (/A073|CTPP/i.test(content)) analise = { status: 'ALERTA', msg: 'CTPP NOVO: Primeira inspeção Julho/2026.' };

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: analise.status, original: content.substring(0, 500) },
          status_conformidade: analise.status,
          legenda_tecnica: analise.msg
        }]);
      } catch (err) { console.error("Falha no arquivo:", f.name); }
    }
    carregarDados();
    setLoading(false);
  };

  const listaFiltrada = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.includes(busca.toUpperCase())
    );
  }, [docs, busca]);

  // TELA DE LOGIN (DNA Maximus)
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-md text-center shadow-2xl">
          <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Lock className="text-black" size={32} />
          </div>
          <h2 className="text-white font-black text-2xl tracking-tighter mb-2">MAXIMUS <span className="text-green-500">PhD</span></h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[4px] mb-8">Acesso Restrito - Cardoso & Rates</p>
          <input 
            type="password" 
            placeholder="Senha de Acesso"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-white mb-4 outline-none focus:border-green-500 transition-all text-center"
            onChange={(e) => setSenha(e.target.value)}
          />
          <button 
            onClick={() => senha === 'admin' && setAutorizado(true)}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-2xl transition-all uppercase text-xs"
          >
            Entrar no Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 print:bg-white">
      
      {/* HEADER DINÂMICO */}
      <header className="h-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={24} />
            <h1 className="text-white font-black tracking-tighter">MAXIMUS <span className="text-green-500">PhD</span></h1>
          </div>
          <nav className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            {['FROTA', 'CONDICIONANTES', 'LAUDOS'].map(aba => (
              <button 
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${abaAtiva === aba ? 'bg-green-600 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {aba}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input 
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-12 pr-4 text-xs w-64 focus:border-green-500 outline-none text-white"
              placeholder="Pesquisar..."
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button onClick={() => fileInputRef.current.click()} className="bg-white text-black font-black px-5 py-2 rounded-xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-500 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
            Auditar
          </button>
          <button onClick={() => window.print()} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:text-white"><Printer size={18}/></button>
        </div>
      </header>

      {/* DASHBOARD */}
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-green-500 text-[10px] font-black tracking-[4px] uppercase mb-1">Unidade Operacional</p>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Controle de {abaAtiva}</h2>
          </div>
          <div className="flex gap-3 print:hidden">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Total Auditado</p>
              <p className="text-xl font-black text-white leading-none">{docs.length}</p>
            </div>
          </div>
        </div>

        {/* LISTAGEM PERICIAL */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/30 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                <th className="p-6">Identificação</th>
                <th className="p-6">Placa/Ref</th>
                <th className="p-6">Parecer Maximus PhD</th>
                <th className="p-6 text-right print:hidden">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {listaFiltrada.map(doc => (
                <tr key={doc.id} className="group hover:bg-green-500/[0.02] transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-green-500 group-hover:border-green-500/30 transition-all">
                        <FileSearch size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase truncate max-w-[250px]">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-700 font-bold uppercase mt-1 tracking-wider">{new Date(doc.data_leitura).toLocaleDateString()} • {doc.tipo_doc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-mono bg-black border border-zinc-800 px-4 py-2 rounded-lg text-white font-black tracking-tighter shadow-xl">
                      {doc.conteudo_extraido?.placa || "FROTA"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10 text-yellow-600' : 'bg-green-500/5 border-green-500/10 text-zinc-400'}`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-600"/>}
                      <span className="text-[11px] font-bold italic uppercase tracking-tight leading-none">{doc.legenda_tecnica}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right print:hidden">
                    <button 
                      onClick={async () => { if(confirm('Remover do banco?')) { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); } }}
                      className="p-3 bg-zinc-900 hover:text-red-500 rounded-xl border border-zinc-800 opacity-20 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.length === 0 && (
            <div className="py-32 text-center">
              <Database className="mx-auto text-zinc-900 mb-4" size={48} />
              <p className="text-[10px] text-zinc-800 font-black uppercase tracking-[10px]">Base Marabá Vazia</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={processarArquivos} />

      {/* FOOTER TECH */}
      <footer className="fixed bottom-0 w-full h-10 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest print:hidden">
        <div className="flex items-center gap-4">
          <span>Cardoso & Rates Engenharia</span>
          <span className="text-zinc-900">|</span>
          <span>Protocolo SEMAS Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-900">Encrypted Cloud Connection</span>
        </div>
      </footer>
    </div>
  );
}
