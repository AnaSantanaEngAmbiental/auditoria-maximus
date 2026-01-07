import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ShieldCheck, FileText, Search, Printer, UploadCloud, 
  Loader2, Building2, CheckCircle2, FileSpreadsheet, 
  HardHat, Trash2, Scale, Info, AlertTriangle, Zap, 
  Maximize2, LayoutDashboard, Truck, Clock
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // PhD Optimization: Inicialização imediata do Worker
  useEffect(() => {
    const initSystem = async () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      await fetchData();
    };
    initSystem();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  };

  const realizarAuditoriaPhD = (texto, nome) => {
    const pMatch = texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi);
    const placa = pMatch ? pMatch[0].toUpperCase().replace(/[- ]/g, "") : "FROTA";
    
    let analise = { status: 'NORMAL', msg: 'Documento processado.' };

    if (/NOTA FISCAL|DANFE/i.test(texto) && /2025/i.test(texto)) {
      analise = { status: 'ISENTO', msg: 'VEÍCULO 0KM: Isenção de CIV/CIPP (Portaria 127/2022).' };
    } else if (/CTPP|CERTIFICADO/i.test(texto)) {
      const v = (texto.match(/(\d{2}\/[A-Z]{3}\/\d{2})/i) || [])[1];
      analise = { status: 'CRÍTICO', msg: `CTPP/INMETRO detectado. Vencimento: ${v || 'Verificar'}` };
    } else if (/15793/i.test(texto) || /LO/i.test(nome)) {
      analise = { status: 'LO', msg: 'Licença de Operação SEMAS/PA. Validade: 24/09/2029.' };
    }

    return { placa, ...analise };
  };

  const handleUpload = async (files) => {
    const list = Array.from(files);
    for (const file of list) {
      const id = Math.random();
      setLogs(p => [{ id, msg: `Auditando ${file.name}...`, status: 'proc' }, ...p]);
      
      try {
        let raw = "";
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buf = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            raw += content.items.map(s => s.str).join(" ") + " ";
          }
        }

        const res = realizarAuditoriaPhD(raw || file.name, file.name);
        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: file.name,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: res,
          status_conformidade: res.status,
          legenda_tecnica: res.msg
        }]);

        setLogs(p => p.map(l => l.id === id ? { ...l, msg: `Concluído: ${res.placa}`, status: 'done' } : l));
        fetchData();
      } catch (e) {
        setLogs(p => p.map(l => l.id === id ? { ...l, msg: 'Erro na leitura', status: 'err' } : l));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-300 font-sans flex overflow-hidden">
      
      {/* SIDEBAR FUTURISTA */}
      <aside className="w-80 bg-[#050505] border-r border-zinc-900 flex flex-col p-8 z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-green-600 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Maximus</h1>
            <span className="text-[9px] font-bold text-green-500 tracking-[4px] uppercase">Control PhD</span>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[3px] mb-4">Módulos de Gestão</div>
          <button className="w-full flex items-center gap-4 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl text-[11px] font-bold uppercase transition-all shadow-lg"><Zap size={20}/> Auditoria Realtime</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 rounded-2xl text-[11px] font-bold uppercase transition-all"><Truck size={20}/> Frota Caeli</button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 rounded-2xl text-[11px] font-bold uppercase transition-all"><Scale size={20}/> Jurídico SEMAS</button>
        </nav>

        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 text-white font-bold text-xs mb-3">
            <Clock size={16} className="text-yellow-500"/> Alertas de Vencimento
          </div>
          <div className="space-y-2">
             <div className="text-[10px] flex justify-between uppercase"><span className="text-zinc-500">LO 15793</span> <span className="text-green-500">2029</span></div>
             <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden"><div className="w-[85%] bg-green-500 h-full"></div></div>
          </div>
        </div>
      </aside>

      {/* DASHBOARD PRINCIPAL - TELA INTEIRA */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-24 border-b border-zinc-900/80 bg-[#030303]/90 backdrop-blur-2xl flex justify-between items-center px-12 z-20">
          <div className="flex items-center gap-8">
            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800"><Building2 className="text-green-500" size={24}/></div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[2px]">Cardoso & Rates Engenharia</h2>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest italic">Unidade de Operações Pará</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-green-500 transition-colors" size={18} />
              <input 
                className="bg-black border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] w-[450px] outline-none focus:border-green-500/50 transition-all shadow-2xl"
                placeholder="PLACA, CHASSI OU TIPO DE LICENÇA..."
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
          
          {/* ÁREA DE CARREGAMENTO ONE-SHOT */}
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#18181b'; }}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-gradient-to-br from-zinc-900/20 to-black border-2 border-dashed border-zinc-900 p-20 rounded-[4rem] text-center hover:bg-green-500/[0.01] transition-all cursor-pointer group shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <div className="bg-zinc-900/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-800 group-hover:scale-110 transition-transform">
               <UploadCloud size={40} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-[12px] group-hover:tracking-[14px] transition-all">Audit Center PhD</h3>
            <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-[4px] font-bold">Arraste seus PDF/Imagens ou Clique para Selecionar</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {/* PAINEL DE STATUS EM TEMPO REAL */}
          {logs.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {logs.slice(0, 4).map(log => (
                <div key={log.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                  {log.status === 'proc' ? <Loader2 size={16} className="text-yellow-500 animate-spin"/> : <CheckCircle2 size={16} className="text-green-500"/>}
                  <span className="text-[10px] font-black text-zinc-400 uppercase truncate">{log.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* TABELA CINEMATOGRÁFICA */}
          <div className="bg-[#050505] border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/30 text-[10px] font-black text-zinc-600 uppercase tracking-[3px] border-b border-zinc-900">
                <tr>
                  <th className="p-10">Evidência Técnica</th>
                  <th className="p-10">Placa / ID</th>
                  <th className="p-10">Relatório de Inteligência</th>
                  <th className="p-10 text-right pr-14">Ação</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-900/40 hover:bg-green-500/[0.01] transition-all group">
                    <td className="p-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 shadow-inner group-hover:border-green-500/50 transition-colors">
                          {doc.tipo_doc === 'PDF' ? <FileText size={24} className="text-zinc-600"/> : <Maximize2 size={24} className="text-zinc-600"/>}
                        </div>
                        <div>
                          <p className="font-black text-white uppercase tracking-tighter truncate w-64 text-base">{doc.nome_arquivo}</p>
                          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-1 italic">{doc.tipo_doc} Sincronizado com Supabase</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-10">
                      <div className="bg-black border border-zinc-900 px-6 py-3 rounded-2xl w-fit shadow-xl">
                        <span className="text-green-500 font-black tracking-[5px] text-base">{doc.conteudo_extraido?.placa || "MASTER"}</span>
                      </div>
                    </td>
                    <td className="p-10">
                       <div className="flex items-start gap-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 leading-relaxed max-w-md shadow-inner transition-transform group-hover:translate-x-1">
                          <Info size={18} className="text-green-600 mt-1 flex-shrink-0"/>
                          <p className="text-zinc-400 italic text-xs font-medium">{doc.legenda_tecnica}</p>
                       </div>
                    </td>
                    <td className="p-10 text-right pr-14">
                       <div className="flex justify-end gap-3">
                          <button className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:text-green-500 transition-all shadow-lg"><Printer size={20}/></button>
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); fetchData(); }} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:text-red-500 transition-all shadow-lg"><Trash2 size={20}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER DE STATUS */}
        <footer className="h-10 bg-black border-t border-zinc-900 flex items-center px-10 justify-between">
            <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-[3px]">Maximus Unified Interface v19.0 - Marabá / Pará</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-bold text-zinc-500 uppercase">Sistema Online</span>
            </div>
        </footer>
      </main>
    </div>
  );
}
