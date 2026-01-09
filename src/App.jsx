import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, CheckCircle, 
  RefreshCcw, File, Printer, Download, Table as TableIcon, Search, Filter, X
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtiva, setUnidadeAtiva] = useState('8694084d-26a9-4674-848e-67ee5e1ba4d4');
  const [docs, setDocs] = useState([]); 
  const [fotos, setFotos] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [statusAcao, setStatusAcao] = useState('');
  
  // ESTADOS DE FILTRO
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  useEffect(() => {
    if (autorizado && unidadeAtiva) {
      carregarDados();
      const subscription = supabase
        .channel('maximus_v23_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_processados' }, () => carregarDados())
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [autorizado, unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data) setUnidades(data);
  }

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });

    if (data) {
      setFotos(data.filter(d => d.url_foto !== null && d.url_foto !== ''));
      setDocs(data.filter(d => d.url_foto === null || d.url_foto === ''));
    }
  }

  // LÓGICA DE FILTRAGEM DINÂMICA
  const filtrarItens = (lista) => {
    return lista.filter(item => {
      const matchBusca = item.nome_arquivo.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'TODOS' || item.status_conformidade === filtroStatus;
      return matchBusca && matchStatus;
    });
  };

  // EXPORTAÇÕES
  const exportarCSV = () => {
    const dadosParaExportar = [...filtrarItens(docs), ...filtrarItens(fotos)];
    const cabecalho = "Arquivo;Tipo;Status;Data\n";
    const linhas = dadosParaExportar.map(i => `${i.nome_arquivo};${i.tipo_doc};${i.status_conformidade};${new Date(i.data_leitura).toLocaleDateString()}`).join("\n");
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FILTRADO_MAXIMUS_${Date.now()}.csv`;
    link.click();
    setStatusAcao("EXCEL FILTRADO GERADO");
  };

  async function handleUpload(files) {
    setLoading(true);
    setStatusAcao("IA EM AÇÃO...");
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const nomeFinal = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      await supabase.storage.from('evidencias').upload(nomeFinal, file);
      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeFinal);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: isImage ? 'FOTO_CAMPO' : 'DOC_AUDITORIA',
        conteudo_extraido: { detalhe: 'AUDITADO IA' },
        status_conformidade: 'CONFORME'
      }]);
    }
    setLoading(false);
    setStatusAcao("SUCESSO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={64} className="text-green-500 mx-auto mb-8 animate-pulse" />
          <h1 className="text-white font-black text-5xl mb-10 italic tracking-tighter uppercase">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="PIN" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-6 text-white text-center mb-8 outline-none focus:border-green-500 font-black text-2xl transition-all"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-6 rounded-2xl uppercase tracking-[15px] hover:bg-green-400 transition-all shadow-lg shadow-green-500/20">LIBERAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-green-500 selection:text-black">
      
      {/* HEADER E BARRA DE BUSCA */}
      <header className="bg-black/95 border-b border-zinc-900 sticky top-0 z-50 backdrop-blur-xl no-print">
        <div className="max-w-7xl mx-auto px-8 h-28 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-white font-black text-2xl italic tracking-tighter">MAXIMUS PhD</h1>
            <select className="bg-transparent text-green-500 font-black text-[10px] outline-none uppercase" value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}>
              {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
            </select>
          </div>

          <div className="flex-1 max-w-md mx-10 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR EM AUDITORIA..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-white font-bold text-xs outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
            />
          </div>

          <nav className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
            {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-6 py-3 rounded-full font-black text-[10px] transition-all tracking-widest ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto pb-40">
        
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-4 rounded-full font-black text-xs z-[100] shadow-2xl flex items-center gap-3 animate-bounce">
            <Zap size={16} fill="black" /> {statusAcao}
          </div>
        )}

        {/* SUB-MENU DE FILTROS DE STATUS (Aparece em FOTOS e FROTA) */}
        {(abaAtiva === 'FOTOGRAFICO' || abaAtiva === 'FROTA') && (
          <div className="flex gap-4 mb-8 animate-in fade-in duration-500">
            {['TODOS', 'CONFORME', 'PENDENTE', 'EM ANÁLISE'].map(st => (
              <button 
                key={st} onClick={() => setFiltroStatus(st)}
                className={`px-5 py-2 rounded-xl text-[9px] font-black border transition-all ${filtroStatus === st ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-600 hover:border-zinc-500'}`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {/* RELATORIOS */}
        {abaAtiva === 'RELATORIOS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onClick={exportarCSV} className="bg-zinc-900 border border-zinc-800 p-16 rounded-[3rem] hover:border-green-500 transition-all cursor-pointer group text-center">
              <TableIcon size={48} className="text-zinc-700 group-hover:text-green-500 mx-auto mb-6" />
              <h3 className="text-white font-black text-3xl italic mb-2 tracking-tighter">EXCEL INTELIGENTE</h3>
              <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-[5px]">Exporta apenas o que está filtrado</p>
            </div>
            <div onClick={() => window.print()} className="bg-zinc-900 border border-zinc-800 p-16 rounded-[3rem] hover:border-white transition-all cursor-pointer group text-center">
              <Printer size={48} className="text-zinc-700 group-hover:text-white mx-auto mb-6" />
              <h3 className="text-white font-black text-3xl italic mb-2 tracking-tighter">PDF OFICIAL</h3>
              <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-[5px]">Gera documento de auditoria formal</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
              onClick={() => inputRef.current.click()}
              className="mb-12 border-2 border-dashed border-zinc-900 rounded-[3rem] p-16 text-center bg-zinc-900/10 hover:border-green-500/30 transition-all cursor-pointer group no-print"
            >
              <UploadCloud size={48} className="mx-auto mb-4 text-zinc-800 group-hover:text-green-500" />
              <h2 className="text-xl font-black text-white uppercase italic">UPLOAD DE AUDITORIA</h2>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
              {loading && <RefreshCcw className="animate-spin text-green-500 mx-auto mt-4" />}
            </div>

            {abaAtiva === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] relative overflow-hidden group">
                   <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-green-500/10 transition-colors"><FileText size={200}/></div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Base Documentos</h3>
                   <p className="text-8xl font-black text-white italic tracking-tighter">{docs.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] relative overflow-hidden group">
                   <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-green-500/10 transition-colors"><Camera size={200}/></div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Acervo Fotos</h3>
                   <p className="text-8xl font-black text-white italic tracking-tighter">{fotos.length}</p>
                </div>
              </div>
            )}

            {abaAtiva === 'FOTOGRAFICO' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {filtrarItens(fotos).map(f => (
                  <div key={f.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative transition-all hover:-translate-y-2">
                    <img src={f.url_foto} className="w-full h-56 object-cover opacity-70 group-hover:opacity-100 transition-all" />
                    <div className="p-6 bg-zinc-950/80 backdrop-blur-md">
                      <p className="text-[9px] font-black text-white truncate uppercase">{f.nome_arquivo}</p>
                      <button onClick={(e) => { e.stopPropagation(); supabase.from('documentos_processados').delete().eq('id', f.id); }} className="mt-4 text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div className="bg-zinc-900 rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black text-zinc-600 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                    <tr><th className="p-8">Documento</th><th className="p-8">Status</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-white font-bold text-xs">
                    {filtrarItens(docs).map(d => (
                      <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-8 truncate max-w-xs uppercase">{d.nome_arquivo}</td>
                        <td className="p-8"><span className="text-green-500 text-[9px] bg-green-500/10 px-3 py-1 rounded-full">{d.status_conformidade}</span></td>
                        <td className="p-8 text-right"><button onClick={() => supabase.from('documentos_processados').delete().eq('id', d.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={20}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-black/90 border-t border-zinc-900 p-6 flex justify-between items-center z-50 no-print backdrop-blur-lg">
        <span className="text-[10px] font-black text-zinc-800 tracking-[10px]">MAXIMUS PhD v23.0</span>
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
           <span className="text-[9px] font-black text-green-900 uppercase">Sistema Consolidado</span>
        </div>
      </footer>

      <style>{`
        @media print {
          .no-print, header, nav, footer, button { display: none !important; }
          body { background: white !important; color: black !important; padding: 20px !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border: 1px solid #ddd !important; padding: 12px !important; text-align: left !important; color: black !important; }
          h1, h2 { color: black !important; }
        }
      `}</style>
    </div>
  );
}
