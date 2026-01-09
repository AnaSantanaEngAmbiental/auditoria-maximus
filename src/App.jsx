import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
// CORREÇÃO: Zap incluído na importação
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, DollarSign, 
  Search, CheckCircle, RefreshCcw, File, X
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
  const [busca, setBusca] = useState('');
  const [novaUnidade, setNovaUnidade] = useState({ razao: '', cnpj: '', atividade: 'Transporte' });

  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) {
      carregarUnidades();
      carregarDados();
    }
  }, [autorizado, unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data) setUnidades(data);
  }

  async function carregarDados() {
    if (!unidadeAtiva) return;
    const { data } = await supabase
      .from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });

    if (data) {
      setFotos(data.filter(d => d.url_foto && (d.url_foto.includes('.jpg') || d.url_foto.includes('.png') || d.url_foto.includes('.jpeg'))));
      setDocs(data.filter(d => !d.url_foto || (!d.url_foto.includes('.jpg') && !d.url_foto.includes('.png') && !d.url_foto.includes('.jpeg'))));
    }
  }

  const sanitizeFileName = (name) => {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  };

  async function handleUpload(files) {
    if (!unidadeAtiva) return;
    setLoading(true);
    setStatusAcao("PROCESSANDO...");

    for (const file of files) {
      const nomeLimpo = sanitizeFileName(file.name);
      const caminhoStorage = `${Date.now()}_${nomeLimpo}`;
      const isImage = file.type.startsWith('image/');

      const { error: upErr } = await supabase.storage.from('evidencias').upload(caminhoStorage, file);
      if (upErr) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(caminhoStorage);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: file.name.split('.').pop().toUpperCase()
      }]);
    }

    await carregarDados();
    setLoading(false);
    setStatusAcao("SUCESSO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  async function deletarItem(id) {
    if(confirm("Excluir definitivamente?")) {
      await supabase.from('documentos_processados').delete().eq('id', id);
      carregarDados();
    }
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border-2 border-zinc-800 p-12 rounded-[3rem] w-full max-w-lg text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 uppercase italic tracking-tighter">Maximus <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-6 text-white text-center mb-6 text-2xl outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === 'admin' || senha === '3840') && setAutorizado(true)}
          />
          <button onClick={() => (senha === 'admin' || senha === '3840') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-6 rounded-2xl text-lg uppercase tracking-widest">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans">
      <header className="h-28 bg-zinc-950/90 border-b border-zinc-900 flex items-center justify-between px-12 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-2xl uppercase italic tracking-tighter">Maximus <span className="text-green-500">PhD</span></h1>
          <select 
            className="bg-transparent text-green-500 font-bold text-sm outline-none cursor-pointer uppercase"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-black">{u.razao_social}</option>)}
          </select>
        </div>

        <nav className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA'].map(aba => (
            <button 
              key={aba} onClick={() => setAbaAtiva(aba)} 
              className={`px-8 py-3 rounded-full font-black text-xs transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {aba}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-10 max-w-7xl mx-auto pb-40">
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-green-500 text-black px-10 py-4 rounded-full font-black text-sm z-[100] shadow-2xl flex items-center gap-2">
            <Zap size={20} /> {statusAcao}
          </div>
        )}

        {abaAtiva !== 'UNIDADES' && (
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
            onClick={() => inputRef.current.click()}
            className="mb-10 border-4 border-dashed border-zinc-900 rounded-[3rem] p-20 text-center bg-zinc-900/10 hover:border-green-500 transition-all cursor-pointer group"
          >
            <UploadCloud size={60} className="mx-auto mb-4 text-zinc-800 group-hover:text-green-500 transition-all" />
            <h2 className="text-3xl font-black text-white italic uppercase">Upload de Auditoria</h2>
            <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-[5px]">Arraste arquivos ou clique</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
          </div>
        )}

        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem]">
              <FileText size={40} className="text-green-500 mb-4" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Documentos</h3>
              <p className="text-7xl font-black text-white italic tracking-tighter">{docs.length}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem]">
              <Camera size={40} className="text-green-500 mb-4" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Evidências</h3>
              <p className="text-7xl font-black text-white italic tracking-tighter">{fotos.length}</p>
            </div>
          </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl group">
                <div className="h-64 overflow-hidden relative">
                  <img src={f.url_foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button onClick={() => deletarItem(f.id)} className="absolute top-4 right-4 p-3 bg-red-600/80 text-white rounded-full hover:bg-red-600"><Trash2 size={20}/></button>
                </div>
                <div className="p-6 bg-zinc-950">
                  <span className="text-white font-bold text-xs truncate uppercase block">{f.nome_arquivo}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
           <div className="bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden shadow-xl">
             <table className="w-full text-left">
               <thead className="bg-zinc-950 text-zinc-600 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                 <tr>
                   <th className="p-6">Documento</th>
                   <th className="p-6 text-right">Controle</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {docs.map(d => (
                   <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                     <td className="p-6">
                        <div className="flex items-center gap-4">
                          <File size={20} className="text-zinc-600" />
                          <span className="text-white font-bold text-sm uppercase">{d.nome_arquivo}</span>
                        </div>
                     </td>
                     <td className="p-6 text-right">
                       <button onClick={() => deletarItem(d.id)} className="text-zinc-700 hover:text-red-500"><Trash2 size={20}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-10 py-4 rounded-full flex items-center gap-6 shadow-2xl">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">v18.1 IA ACTIVE</span>
        <div className="w-px h-4 bg-zinc-800"></div>
        <div className="flex items-center gap-3 text-[10px] font-black text-green-500 italic">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]"></div>
           NÚCLEO MARABÁ
        </div>
      </footer>
    </div>
  );
}
