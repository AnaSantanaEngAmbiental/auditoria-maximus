import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ShieldCheck, Search, Printer, UploadCloud, 
  Loader2, Building2, Trash2, FileSearch, Database
} from 'lucide-react';

// Conexão Direta (Igual ao seu Teste 1 que funcionou)
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const fileInputRef = useRef(null);

  // Carregamento Simples (Baseado no Teste 1)
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    puxarDados();
  }, []);

  async function puxarDados() {
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // Lógica de Auditoria Pericial (Extraída do seu OFICIO e PLANILHA)
  const analisarTexto = (texto) => {
    const placa = (texto.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || ["FROTA"])[0].toUpperCase().replace(/[- ]/g, "");
    
    let parecer = "Documento em análise para renovação SEMAS.";
    
    if (/127\/2022/i.test(texto) || /0 ?KM/i.test(texto)) {
      parecer = "ISENTO: Veículo 0km (Portaria 127/2022). Dispensado de CIV por 12 meses.";
    } else if (/15793/i.test(texto)) {
      parecer = "LO 15793/2025: Licença válida até 24/09/2029. Manter CRLV atualizado.";
    } else if (/A073/i.test(texto) || /CTPP/i.test(texto)) {
      parecer = "CTPP IDENTIFICADO: Equipamento novo. Primeira inspeção em 21/07/2026.";
    }

    return { placa, parecer };
  };

  const processarArquivos = async (files) => {
    setCarregando(true);
    const lista = Array.from(files);

    for (const file of lista) {
      try {
        let conteudo = file.name;
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let textoExtraido = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const pagina = await pdf.getPage(i);
            const content = await pagina.getTextContent();
            textoExtraido += content.items.map(s => s.str).join(" ") + " ";
          }
          conteudo = textoExtraido;
        }

        const auditoria = analisarTexto(conteudo);

        await supabase.from('documentos_processados').insert([{
          unidade_id: '8694084d-26a9-4674-848e-67ee5e1ba4d4',
          nome_arquivo: file.name,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: auditoria,
          status_conformidade: "PROCESSADO",
          legenda_tecnica: auditoria.parecer
        }]);
      } catch (e) {
        console.error("Erro no processamento:", e);
      }
    }
    await puxarDados();
    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans select-none">
      
      {/* HEADER LIMPO - SEM DELAY */}
      <header className="h-20 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-600 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <ShieldCheck size={24} className="text-black" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">MAXIMUS <span className="text-green-500">PHD</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input 
              className="bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-12 pr-6 text-xs w-80 outline-none focus:border-green-500 transition-all text-white"
              placeholder="Localizar placa ou documento..."
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-white text-black font-black px-6 py-2 rounded-full text-xs uppercase hover:bg-green-500 transition-all flex items-center gap-2"
          >
            {carregando ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
            {carregando ? "Processando..." : "Upload Auditoria"}
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL - FOCO TOTAL NOS DADOS */}
      <main className="p-10 max-w-[1600px] mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic">Painel de Controle de Frota</h2>
            <p className="text-xs text-zinc-600 font-bold uppercase tracking-[4px] mt-2">Cardoso & Rates • Unidade Marabá/PA</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl text-center min-w-[150px]">
              <p className="text-[10px] text-zinc-500 font-black uppercase">Sincronizados</p>
              <p className="text-2xl font-black text-green-500">{docs.length}</p>
            </div>
          </div>
        </div>

        {/* TABELA ROBUSTA */}
        <div className="bg-black border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-[#050505] text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
              <tr>
                <th className="p-8">Identificação do Arquivo</th>
                <th className="p-8 text-center">Placa</th>
                <th className="p-8">Parecer de Auditoria (Varredura Total)</th>
                <th className="p-8 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {docs.filter(d => d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-green-500/50 transition-all">
                        <FileSearch size={24} className="text-zinc-600"/>
                      </div>
                      <div>
                        <p className="font-black text-white uppercase text-sm truncate max-w-xs">{doc.nome_arquivo}</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1 italic">{new Date(doc.data_leitura).toLocaleString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-lg font-black tracking-widest text-sm shadow-inner">
                      {doc.conteudo_extraido?.placa || "---"}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl max-w-lg">
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed italic uppercase">
                        {doc.legenda_tecnica}
                      </p>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-zinc-900 hover:text-green-500 rounded-xl border border-zinc-800"><Printer size={18}/></button>
                      <button 
                        onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); puxarDados(); }}
                        className="p-3 bg-zinc-900 hover:text-red-500 rounded-xl border border-zinc-800"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {docs.length === 0 && (
            <div className="p-20 text-center text-zinc-700 uppercase font-black tracking-[10px]">
              Aguardando Upload de Documentos
            </div>
          )}
        </div>
      </main>

      {/* INPUT ESCONDIDO */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        className="hidden" 
        onChange={(e) => processarArquivos(e.target.files)} 
      />

      {/* BARRA DE STATUS INFERIOR */}
      <footer className="fixed bottom-0 w-full h-10 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[9px] font-black text-zinc-600 uppercase tracking-widest">
        <span>Engenharia de Frota • Cardoso & Rates</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Sistema Estabilizado (Lógica Teste 1)
        </div>
      </footer>
    </div>
  );
}
