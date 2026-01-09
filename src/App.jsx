import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  FileSearch, Database, CheckCircle, AlertTriangle, Lock, FileText, 
  LayoutDashboard, Calendar, Briefcase, MapPin
} from 'lucide-react';

// 1. INFRAESTRUTURA CRÍTICA: Configuração Supabase (Vercel ENV)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  // Estados de Controle e Identidade
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('CONDICIONANTES'); 
  const [empresaAtiva, setEmpresaAtiva] = useState('CARDOSO & RATES');
  const fileInputRef = useRef(null);

  // 2. MOTOR DE PDF (Lazy Loading)
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

  // 3. AUDITORIA MULTIATIVIDADES (Extração e Classificação)
  const processarArquivos = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    const pdf = await getPdfEngine();

    for (const f of files) {
      try {
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

        // INTELIGÊNCIA MAXIMUS PhD - Lógica de Atividade
        const placa = (content.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["S/P"])[0].toUpperCase().replace(/[- ]/g, "");
        let analise = { status: 'NORMAL', msg: 'Documento registrado no acervo.' };

        // Auditoria Específica Pará/SEMAS
        if (/127\/2022/i.test(content)) analise = { status: 'CONFORME', msg: 'PORTARIA 127/22: Isenção de CIV para veículo 0km.' };
        else if (/15793/i.test(content)) analise = { status: 'CONFORME', msg: 'LO 15793/25: Cumprimento de condicionante de frota.' };
        else if (/RIAA|RELATORIO ANUAL/i.test(content)) analise = { status: 'CONFORME', msg: 'RIAA: Protocolado conforme Dec. 1.120/09.' };
        else if (/A073|CTPP/i.test(content)) analise = { status: 'ALERTA', msg: 'CTPP: Validade vinculada ao teste de estanqueidade Julho/2026.' };

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: analise.status, empresa: empresaAtiva },
          status_conformidade: analise.status,
          legenda_tecnica: analise.msg
        }]);
      } catch (err) { console.error("Falha:", f.name); }
    }
    carregarDados();
    setLoading(false);
  };

  const docsFiltrados = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.includes(busca.toUpperCase())
    );
  }, [docs, busca]);

  // TELA DE LOGIN (Identidade Maximus)
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <div className="bg-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse">
            <ShieldCheck size={40} className="text-black" />
          </div>
          <h2 className="text-white font-black text-3xl tracking-tighter mb-2">MAXIMUS <span className="text-green-500 italic">PhD</span></h2>
          <p className="text-zinc-600 text-[9px] uppercase tracking-[6px] mb-10 font-bold">Unidade Integrada de Inteligência</p>
          <input 
            type="password" 
            placeholder="Chave do Auditor"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white mb-6 outline-none focus:border-green-500 transition-all text-center font-mono"
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white hover:bg-green-500 text-black font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest">Acessar Infraestrutura</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 print:bg-white">
      
      {/* HEADER MULTIAREAS */}
      <header className="h-24 bg-black/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              MAXIMUS <span className="text-green-500 italic">PhD</span>
            </h1>
            <span className="text-[8px] text-zinc-600 font-bold tracking-[4px] uppercase">Portal do Auditor Ambiental</span>
          </div>

          <nav className="flex gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/50">
            {[
              { id: 'CONDICIONANTES', label: 'Condicionantes SEMAS', icon: <Calendar size={14}/> },
              { id: 'FROTA', label: 'Controle de Frota', icon: <LayoutDashboard size={14}/> },
              { id: 'LAUDOS', label: 'Fábrica de Laudos', icon: <Printer size={14}/> }
            ].map(aba => (
              <button 
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black transition-all ${abaAtiva === aba.id ? 'bg-green-600 text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                {aba.icon} {aba.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-green-500 transition-colors" size={16} />
            <input 
              className="bg-zinc-950 border border-zinc-900 rounded-2xl py-2.5 pl-12 pr-6 text-[11px] w-72 focus:border-green-500 outline-none text-white shadow-inner"
              placeholder="Pesquisa Global de Inteligência..."
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button onClick={() => fileInputRef.current.click()} className="bg-white text-black font-black px-6 py-2.5 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-600 hover:text-white transition-all shadow-xl">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
            {loading ? "Processando" : "Input Universal"}
          </button>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <main className="p-10 max-w-[1600px] mx-auto">
        
        {/* ABA CONDICIONANTES - INTELIGÊNCIA SEMAS/PA */}
        {abaAtiva === 'CONDICIONANTES' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Cronograma de Condicionantes</h2>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[4px] mt-1 flex items-center gap-2">
                   <MapPin size={12} className="text-green-800"/> Base Legal: Decreto Estadual 1.120/2009 • SEMAS-PA
                </p>
              </div>
              <div className="flex gap-4 print:hidden">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-700 uppercase">Status LO 15793</span>
                  <span className="text-green-500 font-mono text-xs font-bold mt-1">VIGENTE ATÉ 24/09/2029</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl group hover:border-green-500/30 transition-all">
                <p className="text-zinc-600 text-[9px] font-black uppercase mb-2">Próximo RIAA</p>
                <p className="text-white font-black text-2xl tracking-tighter uppercase">Agosto / 2026</p>
                <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="w-1/4 h-full bg-green-500"></div></div>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl">
                <p className="text-zinc-600 text-[9px] font-black uppercase mb-2">Renovação de Licença</p>
                <p className="text-white font-black text-2xl tracking-tighter uppercase">24 / SET / 2029</p>
                <p className="text-[9px] text-zinc-700 mt-3 font-bold italic">Protocolo deve ser feito 120 dias antes.</p>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl">
                <p className="text-zinc-600 text-[9px] font-black uppercase mb-2">Documentação de Frota</p>
                <p className="text-white font-black text-2xl tracking-tighter uppercase">{docs.length} Auditados</p>
                <p className="text-[9px] text-green-800 mt-3 font-bold italic">Sincronizado com Supabase em tempo real.</p>
              </div>
            </div>
          </div>
        )}

        {/* LISTAGEM DE AUDITORIA */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl print:border-zinc-200">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/40 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900 print:bg-zinc-100">
              <tr>
                <th className="p-8">Arquivo Pericial</th>
                <th className="p-8 text-center">ID / Placa</th>
                <th className="p-8">Parecer Técnico Maximus PhD</th>
                <th className="p-8 text-right pr-12 print:hidden">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {docsFiltrados.map(doc => (
                <tr key={doc.id} className="group hover:bg-green-500/[0.01] transition-all">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-800 group-hover:text-green-500 group-hover:border-green-500/50 transition-all">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-zinc-200 uppercase tracking-tight">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-700 font-bold uppercase mt-1">Auditor: Philipe • {new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="font-mono bg-zinc-950 border border-zinc-800 px-5 py-2 rounded-xl text-white font-black tracking-widest text-xs shadow-xl print:text-black">
                      {doc.conteudo_extraido?.placa || "FROTA"}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10 text-yellow-600' : 'bg-green-500/5 border-green-500/10 text-zinc-500'} print:border-none`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-600"/>}
                      <span className="text-[10px] font-black italic uppercase leading-none tracking-tight">{doc.legenda_tecnica}</span>
                    </div>
                  </td>
                  <td className="p-8 text-right pr-12 print:hidden">
                    <button 
                      onClick={async () => { if(confirm('Eliminar registro do Supabase?')) { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); } }}
                      className="p-3 bg-zinc-900/50 hover:text-red-500 rounded-xl border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.length === 0 && (
            <div className="py-48 text-center">
              <Database className="mx-auto text-zinc-900 mb-6 animate-pulse" size={60} />
              <p className="text-[10px] text-zinc-800 font-black uppercase tracking-[12px]">Infraestrutura de Dados em Espera</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={processarArquivos} />

      {/* FOOTER CORPORATIVO */}
      <footer className="fixed bottom-0 w-full h-12 bg-black/90 border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-700 uppercase tracking-[3px] print:hidden">
        <div className="flex items-center gap-10">
          <span>Unidade Integrada Maximus PhD</span>
          <span>Protocolo Digital SEMAS-PA</span>
          <span>Direito Ambiental & TI</span>
        </div>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          SISTEMA OPERACIONAL ESTÁVEL
        </div>
      </footer>
    </div>
  );
}
