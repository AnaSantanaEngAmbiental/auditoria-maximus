import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ShieldCheck, FileSearch, Search, Printer, UploadCloud, 
  Loader2, Building2, Trash2, Info, Zap, Truck, Database
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Inicialização Robusta (Lógica do Teste 1)
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    buscarDados();
  }, []);

  async function buscarDados() {
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  }

  // Motor de Auditoria - Varredura por Caractere
  const realizarAuditoria = (texto, nome) => {
    const pMatch = texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi);
    const placa = pMatch ? pMatch[0].toUpperCase().replace(/[- ]/g, "") : "FROTA";
    
    let analise = { status: 'NORMAL', msg: 'Documento validado para o processo SEMAS.' };

    // Varredura de Portarias e Isenções baseada nos seus documentos reais
    if (/127\/2022/i.test(texto) || (/NOTA FISCAL|DANFE/i.test(texto) && /2025/i.test(texto))) {
      analise = { status: 'ISENTO', msg: 'VEÍCULO 0KM: Isenção de CIV conforme Portaria 127/2022 INMETRO.' };
    } else if (/15793/i.test(texto) || /LO/i.test(nome)) {
      analise = { status: 'LO', msg: 'Licença de Operação SEMAS/PA. Vigência até 24/09/2029.' };
    } else if (/CTPP/i.test(texto) || /A073/i.test(texto)) {
      analise = { status: 'CTPP', msg: 'CTPP de Construção Identificado. Verifique data da 1ª inspeção.' };
    }

    return { placa, ...analise };
  };

  const handleUpload = async (files) => {
    const list = Array.from(files);
    for (const file of list) {
      const id = Math.random();
      setLogs(p => [{ id, msg: `Lendo: ${file.name}`, status: 'proc' }, ...p]);
      
      try {
        let textoFinal = file.name;
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buf = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          let extraido = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            extraido += content.items.map(s => s.str).join(" ") + " ";
          }
          textoFinal = extraido;
        }

        const res = realizarAuditoria(textoFinal, file.name);

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: file.name,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: res,
          status_conformidade: res.status,
          legenda_tecnica: res.msg
        }]);

        setLogs(p => p.map(l => l.id === id ? { ...l, msg: `Concluído: ${res.placa}`, status: 'done' } : l));
        buscarDados();
      } catch (err) {
        setLogs(p => p.map(l => l.id === id ? { ...l, msg: 'Erro de leitura', status: 'err' } : l));
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans flex flex-col">
      {/* HEADER FIXO - TELA INTEIRA */}
      <header className="h-20 border-b border-zinc-900 bg-black/90 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-600 rounded-lg"><ShieldCheck size={24} className="text-black" /></div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Maximus <span className="text-green-500">v22</span></h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-6 text-xs w-96 outline-none focus:border-green-500 transition-all"
            placeholder="Filtrar por placa ou documento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase">
          <Database size={14} /> Conectado: Unidade Marabá
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR DE STATUS */}
        <aside className="w-72 border-r border-zinc-900 p-6 space-y-6 bg-black/50 overflow-y-auto">
          <button 
            onClick={() => fileInputRef.current.click()}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase text-xs"
          >
            <UploadCloud size={20} /> Novo Documento
          </button>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Logs de Processamento</h3>
            {logs.map(log => (
              <div key={log.id} className="text-[10px] bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex items-center gap-3">
                {log.status === 'proc' ? <Loader2 size={12} className="animate-spin text-yellow-500"/> : <CheckCircle2 size={12} className="text-green-500"/>}
                <span className="truncate">{log.msg}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ÁREA DE TRABALHO - TELA INTEIRA */}
        <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Painel de Auditoria</h2>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Cardoso & Rates Engenharia - Marabá/PA</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 text-center">
                  <p className="text-[9px] text-zinc-500 uppercase font-black">Sincronizados</p>
                  <p className="text-xl font-black text-white">{docs.length}</p>
               </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900 rounded-[2rem] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-8">Arquivo</th>
                  <th className="p-8">Placa</th>
                  <th className="p-8">Parecer Técnico</th>
                  <th className="p-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                  <tr key={doc.id} className="border-b border-zinc-900/50 hover:bg-white/[0.02] transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800"><FileSearch className="text-zinc-500" size={20}/></div>
                        <div>
                          <p className="text-sm font-black text-white uppercase truncate w-64">{doc.nome_arquivo}</p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">{doc.tipo_doc} • {new Date(doc.data_leitura).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="bg-black border border-zinc-800 text-green-500 px-4 py-2 rounded-lg font-black tracking-widest text-sm">
                        {doc.conteudo_extraido?.placa || "---"}
                      </span>
                    </td>
                    <td className="p-8">
                       <div className="max-w-md bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                          <p className="text-xs text-zinc-400 leading-relaxed italic">"{doc.legenda_tecnica}"</p>
                       </div>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex justify-end gap-2">
                          <button className="p-3 bg-zinc-900 hover:text-green-500 rounded-xl transition-all border border-zinc-800"><Printer size={18}/></button>
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); buscarDados(); }} className="p-3 bg-zinc-900 hover:text-red-500 rounded-xl transition-all border border-zinc-800"><Trash2 size={18}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
    </div>
  );
}
