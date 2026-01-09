import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Search, Printer, UploadCloud, Loader2, Trash2, 
  FileSearch, Database, CheckCircle, AlertTriangle, Lock, FileText, 
  LayoutDashboard, Calendar, FileDown, ClipboardCheck
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// 1. INFRAESTRUTURA CRÍTICA: Supabase (Vercel ENV)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('LAUDOS'); 
  const [empresaAtiva, setEmpresaAtiva] = useState({
    nome: 'CARDOSO & RATES, TRANSPORTE DE CARGA LTDA',
    cnpj: '38.404.019/0001-76',
    rua: 'Rua Meireles Neves, n. 43, Bairro Araguaia, Marabá/PA'
  });
  const fileInputRef = useRef(null);

  // 2. MOTOR DE PDF (Leitura de Documentos)
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

  // 3. FÁBRICA DE LAUDOS: Gerador de Ofício Requerimento SEMAS
  const gerarOficioSEMAS = () => {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Cabeçalho Corporativo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(empresaAtiva.nome, 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${empresaAtiva.cnpj}`, 20, 26);
    doc.text(empresaAtiva.rua, 20, 31);
    
    doc.line(20, 35, 190, 35); // Linha divisória

    // Destinatário
    doc.text("À Secretaria de Estado de Meio Ambiente e Sustentabilidade - SEMAS/PA", 20, 50);
    doc.setFont("helvetica", "bold");
    doc.text("ASSUNTO: Protocolo de Documentação de Frota - LO 15793/2025", 20, 60);

    // Corpo do Texto
    doc.setFont("helvetica", "normal");
    const texto = `A empresa ${empresaAtiva.nome}, inscrita no CNPJ sob o n° ${empresaAtiva.cnpj}, vem respeitosamente à presença de V.Sª solicitar a inclusão/atualização da frota de transporte de produtos perigosos vinculada ao nosso licenciamento ambiental. Segue abaixo a relação de placas auditadas e conformes para operação:`;
    const splitTexto = doc.splitTextToSize(texto, 170);
    doc.text(splitTexto, 20, 75);

    // Tabela de Placas Automática
    const placasTabela = docs.map(d => [
      d.conteudo_extraido?.placa || "FROTA",
      d.nome_arquivo.substring(0, 50),
      d.status_conformidade
    ]);

    doc.autoTable({
      startY: 100,
      head: [['PLACA', 'DOCUMENTO ORIGEM', 'STATUS']],
      body: placasTabela,
      theme: 'grid',
      headStyles: { fillColor: [0, 100, 0] }
    });

    doc.text(`Marabá - PA, ${dataAtual}`, 20, doc.lastAutoTable.finalY + 20);
    doc.text("__________________________________________", 20, doc.lastAutoTable.finalY + 40);
    doc.text("Responsável Técnico / Representante Legal", 20, doc.lastAutoTable.finalY + 45);

    doc.save(`Oficio_SEMAS_${empresaAtiva.nome.substring(0,10)}.pdf`);
  };

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

        const placa = (content.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["S/P"])[0].toUpperCase().replace(/[- ]/g, "");
        let analise = { status: 'NORMAL', msg: 'Documento registrado.' };

        if (/127\/2022/i.test(content)) analise = { status: 'CONFORME', msg: 'PORTARIA 127/22: Isento (0km).' };
        else if (/15793/i.test(content)) analise = { status: 'CONFORME', msg: 'LO 15793/25: Condicionante Atendida.' };
        else if (/A073|CTPP/i.test(content)) analise = { status: 'ALERTA', msg: 'CTPP: Validade Julho/2026.' };

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: f.name,
          tipo_doc: f.name.split('.').pop().toUpperCase(),
          conteudo_extraido: { placa, status: analise.status, empresa: empresaAtiva.nome },
          status_conformidade: analise.status,
          legenda_tecnica: analise.msg
        }]);
      } catch (err) { console.error("Falha:", f.name); }
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

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <div className="bg-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <Lock size={35} className="text-black" />
          </div>
          <h2 className="text-white font-black text-3xl tracking-tighter mb-1">MAXIMUS <span className="text-green-500 italic">PhD</span></h2>
          <p className="text-zinc-600 text-[9px] uppercase tracking-[6px] mb-10 font-bold">Unidade Integrada de Perícia</p>
          <input 
            type="password" 
            placeholder="Chave de Auditoria"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-white mb-6 outline-none focus:border-green-500 transition-all text-center font-mono"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest hover:bg-green-500">Acessar Unidade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans print:bg-white">
      
      {/* HEADER DINÂMICO */}
      <header className="h-24 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
            <span className="text-[8px] text-zinc-600 font-bold tracking-[4px] uppercase italic">Cardoso & Rates Engenharia</span>
          </div>

          <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
            {[
              { id: 'LAUDOS', label: 'Fábrica de Laudos', icon: <FileDown size={14}/> },
              { id: 'FROTA', label: 'Frota Auditada', icon: <LayoutDashboard size={14}/> },
              { id: 'CONDICIONANTES', label: 'Condicionantes', icon: <Calendar size={14}/> }
            ].map(aba => (
              <button 
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black transition-all ${abaAtiva === aba.id ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-zinc-200'}`}
              >
                {aba.icon} {aba.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-green-500" size={16} />
            <input 
              className="bg-zinc-950 border border-zinc-900 rounded-2xl py-2.5 pl-12 pr-6 text-[11px] w-72 focus:border-green-500 outline-none text-white transition-all"
              placeholder="Pesquisar Auditoria..."
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button onClick={() => fileInputRef.current.click()} className="bg-white text-black font-black px-6 py-2.5 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-600 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
            {loading ? "Auditando" : "Subir PDF"}
          </button>
        </div>
      </header>

      <main className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* ABA FÁBRICA DE LAUDOS */}
        {abaAtiva === 'LAUDOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem] hover:border-green-500/30 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 group-hover:bg-green-600 group-hover:text-black transition-all">
                  <ClipboardCheck size={32} />
                </div>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Modelo SEMAS-PA</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Ofício de Requerimento</h3>
              <p className="text-zinc-500 text-xs mb-8 leading-relaxed italic">Gera automaticamente o ofício para a SEMAS listando todas as placas e conformidades detectadas no sistema.</p>
              <button 
                onClick={gerarOficioSEMAS}
                className="w-full bg-zinc-950 border border-zinc-800 hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                <FileDown size={18}/> Baixar PDF Inteligente
              </button>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-[3rem] flex flex-col justify-center items-center text-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <Printer size={40} className="mb-4 text-zinc-700"/>
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Módulo Procuração (EM BREVE)</h3>
            </div>
          </div>
        )}

        {/* TABELA DE REGISTROS */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
              <tr>
                <th className="p-8">Documento Auditado</th>
                <th className="p-8 text-center">ID / Placa</th>
                <th className="p-8">Análise Pericial PhD</th>
                <th className="p-8 text-right pr-12 print:hidden">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {listaFiltrada.map(doc => (
                <tr key={doc.id} className="group hover:bg-green-500/[0.01] transition-all">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700 group-hover:text-green-500 transition-all">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-zinc-200 uppercase tracking-tight">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-700 font-bold mt-1">Auditado em {new Date(doc.data_leitura).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="font-mono bg-zinc-950 border border-zinc-800 px-5 py-2 rounded-xl text-white font-black tracking-widest text-xs shadow-xl group-hover:border-green-500/30">
                      {doc.conteudo_extraido?.placa || "FROTA"}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${doc.status_conformidade === 'ALERTA' ? 'bg-yellow-500/5 border-yellow-500/10 text-yellow-600' : 'bg-green-500/5 border-green-500/10 text-zinc-500'}`}>
                      {doc.status_conformidade === 'ALERTA' ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-600"/>}
                      <span className="text-[10px] font-black uppercase italic tracking-tight">{doc.legenda_tecnica}</span>
                    </div>
                  </td>
                  <td className="p-8 text-right pr-12 print:hidden">
                    <button 
                      onClick={async () => { if(confirm('Remover auditoria?')) { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); } }}
                      className="p-3 bg-zinc-900/50 hover:text-red-500 rounded-xl border border-zinc-800 opacity-20 group-hover:opacity-100 transition-all"
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
              <p className="text-[10px] text-zinc-800 font-black uppercase tracking-[12px]">Base de Perícia Desconectada</p>
            </div>
          )}
        </div>
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={processarArquivos} />

      <footer className="fixed bottom-0 w-full h-12 bg-black/95 border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px] print:hidden">
        <div className="flex items-center gap-10">
          <span>Maximus PhD v3.0</span>
          <span>Protocolo SEMAS Integrado</span>
          <span>Engenharia & Direito Ambiental</span>
        </div>
        <div className="flex items-center gap-3 text-green-900">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          AUDITORIA MARABÁ ONLINE
        </div>
      </footer>
    </div>
  );
}
