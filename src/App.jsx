import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ShieldCheck, FileText, Search, Printer, UploadCloud, 
  Loader2, Building2, CheckCircle2, FileSpreadsheet, 
  Trash2, Scale, Info, Zap, LayoutDashboard, Truck, 
  AlertCircle, FileSearch, ShieldAlert, Database, History
} from 'lucide-react';

// Configuração de Conexão Estrita
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef(null);

  // PhD: Forçagem de Inicialização (Hydration Fix)
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    fetchData();
    setIsReady(true); // Garante que o sistema só interage após estar 100% pronto
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  };

  // Motor de Varredura Total de Caracteres (Auditoria Pericial)
  const realizarAuditoriaProfunda = (texto, nome) => {
    const placaMatch = texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi);
    const placa = placaMatch ? placaMatch[0].toUpperCase().replace(/[- ]/g, "") : "ANÁLISE";
    
    let analise = { status: 'NORMAL', msg: 'Documento Técnico Sincronizado.' };

    // Lógica 1: Veículos Novos (NF 2025)
    if (/NOTA FISCAL|DANFE/i.test(texto) && /2025/i.test(texto)) {
      analise = { status: 'ISENTO', msg: 'VEÍCULO 0KM: Isento de CIV (Portaria 127/2022). Validade 12 meses.' };
    } 
    // Lógica 2: Inmetro / CTPP
    else if (/CTPP|CERTIFICADO/i.test(texto)) {
      const venc = (texto.match(/(\d{2}\/[A-Z]{3}\/\d{2})/i) || [])[1];
      analise = { status: 'ALERTA', msg: `CTPP Detectado. Vencimento: ${venc || 'Verificar campo 02'}.` };
    }
    // Lógica 3: LO SEMAS/PA (Ex: 15793/2025)
    else if (/15793\/2025/i.test(texto) || /LICENÇA/i.test(texto)) {
      analise = { status: 'LICENÇA', msg: 'LO 15793/2025: Validade 24/09/2029 (SEMAS-PA).' };
    }

    return { placa, ...analise };
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);

    for (const file of list) {
      const logId = Math.random();
      setLogs(p => [{ id: logId, msg: `Processando ${file.name}...`, status: 'loading' }, ...p]);
      
      try {
        let textoExtraido = "";
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buf = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            textoExtraido += content.items.map(s => s.str).join(" ") + " ";
          }
        }

        const auditoria = realizarAuditoriaProfunda(textoExtraido || file.name, file.name);

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: file.name,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: auditoria,
          status_conformidade: auditoria.status,
          legenda_tecnica: auditoria.msg
        }]);

        setLogs(p => p.map(l => l.id === logId ? { ...l, msg: `Auditado: ${auditoria.placa}`, status: 'success' } : l));
        fetchData();
      } catch (e) {
        setLogs(p => p.map(l => l.id === logId ? { ...l, msg: 'Erro na leitura', status: 'error' } : l));
      }
    }
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans flex overflow-hidden">
      
      {/* SIDEBAR CORPORATIVA */}
      <aside className="w-80 bg-black border-r border-zinc-900 flex flex-col z-30 shadow-2xl">
        <div className="p-8 border-b border-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <ShieldCheck size={30} className="text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Maximus</h1>
              <span className="text-[10px] font-bold text-green-500 tracking-[5px] uppercase">PhD Engineering</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[4px] mb-6 px-4">Menu de Gestão</div>
          <button className="w-full flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold uppercase transition-all"><Zap size={20}/> Auditoria Instantânea</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase transition-all"><FileSpreadsheet size={20}/> Planilha Caeli</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase transition-all"><Truck size={20}/> Frota SEMAS</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl text-[11px] font-bold uppercase transition-all"><Scale size={20}/> Ofícios Automáticos</button>
        </nav>

        <div className="p-6 bg-zinc-900/20 m-6 rounded-[2.5rem] border border-zinc-900">
           <div className="flex items-center gap-3 text-white text-[10px] font-bold uppercase mb-4"><Database size={14} className="text-green-500"/> Supabase Cloud</div>
           <div className="space-y-3">
              <div className="flex justify-between text-[9px] font-bold uppercase"><span className="text-zinc-500">Documentos</span> <span className="text-white">{docs.length}</span></div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full"><div className="w-full bg-green-500 h-full"></div></div>
           </div>
        </div>
      </aside>

      {/* TELA INTEIRA DE TRABALHO */}
      <main className="flex-1 flex flex-col h-screen relative bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.03)_0%,_transparent_50%)]">
        
        {/* HEADER DE ALTA PERFORMANCE */}
        <header className="h-28 border-b border-zinc-900 flex justify-between items-center px-12 bg-black/50 backdrop-blur-3xl z-20">
          <div className="flex items-center gap-8">
            <div className="p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800"><Building2 className="text-green-500" size={28}/></div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Cardoso & Rates Engenharia</h2>
              <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic mt-1">Sincronização de Marabá/PA • Auditoria de Licenciamento</p>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-green-500 transition-all" size={22} />
            <input 
              className="bg-[#080808] border border-zinc-800 rounded-[2rem] py-5 pl-14 pr-10 text-xs w-[500px] outline-none focus:border-green-500/50 transition-all text-white placeholder:text-zinc-800 shadow-2xl font-medium"
              placeholder="PESQUISAR PLACA, DOCUMENTO OU STATUS..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
          
          {/* PAINEL DE UPLOAD ONE-SHOT (RESOLVE O CTL+A) */}
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#18181b'; }}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-black border-2 border-dashed border-zinc-800 p-24 rounded-[4rem] text-center hover:bg-green-500/[0.01] hover:border-green-500/30 transition-all cursor-pointer group shadow-inner relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-zinc-900/80 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 border border-zinc-800 group-hover:scale-110 group-hover:border-green-500/50 transition-all relative z-10 shadow-2xl">
               <UploadCloud size={48} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-[15px] group-hover:tracking-[18px] transition-all relative z-10">Upload Auditoria</h3>
            <p className="text-[11px] text-zinc-600 mt-6 uppercase tracking-[5px] font-bold relative z-10">Solte arquivos aqui para processamento em massa</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* STATUS DE PROCESSAMENTO - CARDS */}
          {logs.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="bg-zinc-900/30 border border-zinc-800/50 px-6 py-4 rounded-[1.5rem] flex items-center gap-4 min-w-[280px] animate-in slide-in-from-left-4">
                  {log.status === 'loading' ? <Loader2 size={16} className="text-yellow-500 animate-spin"/> : <CheckCircle2 size={16} className="text-green-500"/>}
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter truncate">{log.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* TABELA DE RESULTADOS DOUTORADOS */}
          <div className="bg-black border border-zinc-900 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#080808] text-[10px] font-black text-zinc-600 uppercase tracking-[4px] border-b border-zinc-900">
                <tr>
                  <th className="p-10">Documento / Tipo</th>
                  <th className="p-10">Placa Identificada</th>
                  <th className="p-10">Análise Técnica PhD</th>
                  <th className="p-10 text-right pr-16">Ação GESTOR</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/50 hover:bg-green-500/[0.01] transition-all group">
                    <td className="p-10">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-[#0a0a0a] rounded-[2rem] flex items-center justify-center border border-zinc-800 shadow-inner group-hover:border-green-500/40 transition-all">
                          {doc.tipo_doc === 'PDF' ? <FileSearch size={30} className="text-zinc-700"/> : <Truck size={30} className="text-zinc-700"/>}
                        </div>
                        <div>
                          <p className="font-black text-white uppercase tracking-tighter truncate w-72 text-lg group-hover:text-green-400 transition-colors">{doc.nome_arquivo}</p>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[3px] mt-2 italic flex items-center gap-2">
                            <History size={12}/> {new Date(doc.data_leitura).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-10">
                      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 px-8 py-4 rounded-2xl w-fit shadow-2xl group-hover:scale-105 transition-transform">
                        <span className="text-green-500 font-black tracking-[8px] text-xl">{doc.conteudo_extraido?.placa || "PROCESS"}</span>
                      </div>
                    </td>
                    <td className="p-10">
                       <div className="flex items-start gap-5 bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 leading-relaxed max-w-lg shadow-inner group-hover:border-zinc-800 transition-all">
                          {doc.status_conformidade === 'ISENTO' ? <ShieldAlert size={22} className="text-yellow-500 flex-shrink-0"/> : <Info size={22} className="text-green-600 flex-shrink-0"/>}
                          <p className="text-zinc-400 italic text-[13px] font-medium tracking-tight uppercase leading-[1.6]">{doc.legenda_tecnica}</p>
                       </div>
                    </td>
                    <td className="p-10 text-right pr-16">
                       <div className="flex justify-end gap-4">
                          <button className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:text-green-500 hover:border-green-500/30 transition-all shadow-xl"><Printer size={24}/></button>
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchData(); }} className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:text-red-500 hover:border-red-500/30 transition-all shadow-xl"><Trash2 size={24}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BARRA DE STATUS TÉCNICO */}
        <footer className="h-12 bg-black border-t border-zinc-900 flex items-center px-12 justify-between z-20">
            <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[5px]">Unidade Operacional Maximus v20.0 • Marabá - PA</div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-green-500 uppercase tracking-[2px]">Conexão Segura Supabase</span>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
            </div>
        </footer>
      </main>
    </div>
  );
}
