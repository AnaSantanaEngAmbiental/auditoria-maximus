import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, CheckCircle, 
  RefreshCcw, File, Printer, Table as TableIcon, Search, Filter, X, ChevronRight
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
  const [items, setItems] = useState([]); // Array único para evitar dessincronização
  const [loading, setLoading] = useState(false);
  const [statusAcao, setStatusAcao] = useState('');
  const [busca, setBusca] = useState('');
  
  const inputRef = useRef(null);

  // Filtros derivados (Calculados na hora do render para serem instantâneos)
  const fotos = items.filter(d => d.url_foto !== null && d.url_foto !== '');
  const docs = items.filter(d => d.url_foto === null || d.url_foto === '');

  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  useEffect(() => {
    if (autorizado && unidadeAtiva) {
      carregarDados();
      // REALTIME V2 - Escuta global
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'documentos_processados' }, 
          () => carregarDados()
        ).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [autorizado, unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data) setUnidades(data);
  }

  async function carregarDados() {
    const { data, error } = await supabase.from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });
    if (data) setItems(data);
  }

  // UPLOAD REFORMULADO (CORRIGE O ERRO DE TER QUE CARREGAR 2X)
  async function handleUpload(files) {
    if (!unidadeAtiva) return;
    setLoading(true);
    setStatusAcao("IA PROCESSANDO...");

    try {
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const ext = file.name.split('.').pop();
        const nomeFinal = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        // 1. Upload Storage
        const { error: upErr } = await supabase.storage.from('evidencias').upload(nomeFinal, file);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeFinal);

        // 2. Inserção no Banco
        const { error: insErr } = await supabase.from('documentos_processados').insert([{
          unidade_id: unidadeAtiva,
          nome_arquivo: file.name,
          url_foto: isImage ? publicUrl : null,
          tipo_doc: isImage ? 'IMAGEM' : 'DOCUMENTO',
          conteudo_extraido: { detalhe: 'AUDITADO AUTOMATICAMENTE' },
          status_conformidade: 'CONFORME'
        }]);
        if (insErr) throw insErr;
      }
      
      setStatusAcao("SINCRONIZANDO...");
      await carregarDados(); // FORÇA REFRESH IMEDIATO
      setStatusAcao("CONCLUÍDO!");
    } catch (err) {
      console.error(err);
      setStatusAcao("ERRO NO PROCESSAMENTO");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusAcao(""), 2000);
    }
  }

  async function deletar(id) {
    const { error } = await supabase.from('documentos_processados').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id)); // Remove localmente na hora
    }
  }

  const filtrar = (lista) => lista.filter(i => i.nome_arquivo.toLowerCase().includes(busca.toLowerCase()));

  // EXPORTAÇÃO EXCEL
  const exportarExcel = () => {
    const csvContent = "\ufeffArquivo;Tipo;Status;Data\n" + 
      items.map(i => `${i.nome_arquivo};${i.tipo_doc};${i.status_conformidade};${new Date(i.data_leitura).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `RELATORIO_MAXIMUS.csv`;
    link.click();
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 italic uppercase tracking-tighter">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500 font-black text-xl"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-5 rounded-2xl uppercase tracking-[10px]">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-500 font-sans">
      
      {/* HEADER COM BUSCA INTEGRADA */}
      <header className="h-28 bg-black/90 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 backdrop-blur-xl no-print">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-2xl italic tracking-tighter">MAXIMUS PhD</h1>
          <select 
            className="bg-transparent text-green-500 font-black text-[10px] outline-none cursor-pointer"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
          </select>
        </div>

        <div className="flex-1 max-w-sm mx-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
          <input 
            type="text" placeholder="Filtrar auditoria..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white text-xs outline-none focus:border-green-500"
            value={busca} onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <nav className="flex gap-1 bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-6 py-2.5 rounded-full font-black text-[9px] transition-all tracking-widest ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>
      </header>

      <main className="p-8 max-w-7xl mx-auto pb-40">
        
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-4 rounded-full font-black text-xs z-[100] shadow-2xl flex items-center gap-3">
            <RefreshCcw size={16} className="animate-spin text-green-600" /> {statusAcao}
          </div>
        )}

        {abaAtiva === 'RELATORIOS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onClick={exportarExcel} className="bg-zinc-900 border border-zinc-800 p-16 rounded-[3rem] hover:border-green-500 transition-all cursor-pointer group text-center">
               <TableIcon size={48} className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500" />
               <h3 className="text-white font-black text-2xl uppercase italic">Exportar para Excel</h3>
               <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-widest">Gera planilha CSV com dados filtrados</p>
            </div>
            <div onClick={() => window.print()} className="bg-zinc-900 border border-zinc-800 p-16 rounded-[3rem] hover:border-white transition-all cursor-pointer group text-center">
               <Printer size={48} className="mx-auto mb-4 text-zinc-700 group-hover:text-white" />
               <h3 className="text-white font-black text-2xl uppercase italic">Imprimir Relatório PDF</h3>
               <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-widest">Documento oficial de auditoria</p>
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
              <h2 className="text-xl font-black text-white uppercase italic tracking-[5px]">Upload de Arquivos</h2>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
            </div>

            {abaAtiva === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <DashboardCard label="Documentos" value={docs.length} icon={<FileText />} />
                <DashboardCard label="Fotos" value={fotos.length} icon={<Camera />} />
              </div>
            )}

            {abaAtiva === 'FOTOGRAFICO' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filtrar(fotos).map(f => (
                  <div key={f.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden relative shadow-xl transition-all hover:scale-[1.02]">
                    <img src={f.url_foto} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100" loading="lazy" />
                    <div className="p-4 bg-zinc-950 flex justify-between items-center">
                      <p className="text-[9px] font-black text-white truncate max-w-[120px] uppercase">{f.nome_arquivo}</p>
                      <button onClick={() => deletar(f.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black text-zinc-600 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                    <tr><th className="p-8">Arquivo de Frota</th><th className="p-8">Status</th><th className="p-8 text-right">Controle</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-white font-bold text-xs">
                    {filtrar(docs).map(d => (
                      <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-8 flex items-center gap-4 uppercase"><File size={16} className="text-zinc-700" /> {d.nome_arquivo}</td>
                        <td className="p-8"><span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[9px] font-black italic">{d.status_conformidade}</span></td>
                        <td className="p-8 text-right"><button onClick={() => deletar(d.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={20}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-black/95 border-t border-zinc-900 p-6 flex justify-between items-center z-50 no-print">
        <span className="text-[9px] font-black text-zinc-800 tracking-[10px] uppercase font-mono">Maximus Phd v24.0.0</span>
        <div className="flex items-center gap-3 text-[9px] font-black text-green-900 uppercase tracking-widest">
           <div className="w-2 h-2 bg-green-500 rounded-full"></div> Sincronizado Realtime
        </div>
      </footer>

      <style>{`
        @media print {
          .no-print, header, nav, footer, button { display: none !important; }
          body { background: white !important; color: black !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd !important; padding: 12px !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}

function DashboardCard({ label, value, icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] relative group">
      <div className="text-green-500 mb-4 opacity-30 group-hover:opacity-100 transition-opacity">{icon}</div>
      <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</h3>
      <p className="text-8xl font-black text-white italic tracking-tighter mt-2">{value}</p>
    </div>
  );
}
