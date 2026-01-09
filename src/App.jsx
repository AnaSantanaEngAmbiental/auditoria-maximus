import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, Plus, 
  X, Zap, LayoutDashboard, FileText, Camera, DollarSign, Briefcase
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
  const [unidadeAtiva, setUnidadeAtiva] = useState('');
  const [docs, setDocs] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [statusAcao, setStatusAcao] = useState('');
  const [novaUnidade, setNovaUnidade] = useState({ razao: '', cnpj: '', atividade: 'Transporte' });

  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) {
      carregarUnidades();
    }
  }, [autorizado]);

  useEffect(() => {
    if (unidadeAtiva) carregarDados();
  }, [unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data && data.length > 0) {
      setUnidades(data);
      if (!unidadeAtiva) setUnidadeAtiva(data[0].id);
    }
  }

  async function carregarDados() {
    const { data, error } = await supabase.from('documentos_processados')
      .select('*').eq('unidade_id', unidadeAtiva);
    if (data) {
      setDocs(data.filter(d => !d.url_foto));
      setFotos(data.filter(d => d.url_foto));
    }
  }

  async function handleUpload(files) {
    setStatusAcao("Enviando para Nuvem...");
    for (const file of files) {
      const name = `${Date.now()}_${file.name}`;
      const isImg = file.type.startsWith('image/');
      
      const { error: upErr } = await supabase.storage.from('evidencias').upload(name, file);
      if (upErr) { console.error(upErr); continue; }

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(name);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImg ? publicUrl : null,
        tipo_doc: file.name.split('.').pop().toUpperCase()
      }]);
    }
    carregarDados();
    setStatusAcao("Sincronizado!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  async function addUnidade() {
    if(!novaUnidade.razao || !novaUnidade.cnpj) return;
    await supabase.from('unidades_maximus').insert([{
      razao_social: novaUnidade.razao.toUpperCase(),
      cnpj: novaUnidade.cnpj,
      atividade_principal: novaUnidade.atividade
    }]);
    setNovaUnidade({ razao: '', cnpj: '', atividade: 'Transporte' });
    carregarUnidades();
    setAbaAtiva('DASHBOARD');
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 font-sans text-[18px]">
        <div className="bg-zinc-900 border-4 border-zinc-800 p-20 rounded-[5rem] w-full max-w-2xl text-center">
          <ShieldCheck size={100} className="text-green-500 mx-auto mb-10" />
          <h1 className="text-white font-black text-6xl mb-12 italic tracking-tighter uppercase">Maximus <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border-4 border-zinc-800 rounded-3xl py-10 text-white text-center mb-8 text-4xl outline-none"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-10 rounded-3xl text-2xl uppercase tracking-[15px]">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 text-[18px]">
      <header className="h-36 bg-zinc-950/80 border-b-4 border-zinc-900 flex items-center justify-between px-20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-4xl uppercase tracking-tighter">Maximus <span className="text-green-500 italic">PhD</span></h1>
          <select 
            className="bg-transparent text-green-500 font-bold text-xl outline-none mt-2"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-black text-white">{u.razao_social}</option>)}
          </select>
        </div>

        <nav className="flex gap-4 bg-black p-3 rounded-[3rem] border-2 border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'UNIDADES'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-12 py-5 rounded-[2.5rem] font-black text-sm transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600'}`}>{aba}</button>
          ))}
        </nav>
      </header>

      <main className="p-20 max-w-[2400px] mx-auto pb-64">
        {statusAcao && <div className="fixed top-48 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-full font-black text-2xl z-[500] border-4 border-green-500 shadow-2xl">{statusAcao}</div>}

        {abaAtiva === 'UNIDADES' && (
          <div className="bg-zinc-900/50 p-20 rounded-[5rem] border-4 border-zinc-800 grid gap-10">
            <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-widest">Nova Unidade</h2>
            <input placeholder="RAZÃO SOCIAL" className="bg-black border-4 border-zinc-800 p-10 rounded-3xl text-2xl text-white outline-none" value={novaUnidade.razao} onChange={e => setNovaUnidade({...novaUnidade, razao: e.target.value})} />
            <input placeholder="CNPJ" className="bg-black border-4 border-zinc-800 p-10 rounded-3xl text-2xl text-white outline-none" value={novaUnidade.cnpj} onChange={e => setNovaUnidade({...novaUnidade, cnpj: e.target.value})} />
            <select className="bg-black border-4 border-zinc-800 p-10 rounded-3xl text-2xl text-white outline-none" value={novaUnidade.atividade} onChange={e => setNovaUnidade({...novaUnidade, atividade: e.target.value})}>
              <option value="Transporte">Transporte</option>
              <option value="Posto">Posto</option>
              <option value="Industria">Indústria</option>
            </select>
            <button onClick={addUnidade} className="bg-green-600 text-black font-black py-10 rounded-3xl text-2xl hover:bg-white transition-all uppercase">Cadastrar Agora</button>
          </div>
        )}

        {abaAtiva !== 'UNIDADES' && (
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
            onClick={() => inputRef.current.click()}
            className="mb-20 border-8 border-dashed border-zinc-900 rounded-[5rem] p-32 text-center bg-zinc-900/10 hover:border-green-500 cursor-pointer"
          >
            <UploadCloud size={100} className="mx-auto mb-8 text-zinc-800" />
            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Arraste aqui</h2>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
          </div>
        )}

        {abaAtiva === 'DASHBOARD' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="bg-zinc-900/50 border-4 border-zinc-800 p-20 rounded-[5rem]">
                <DollarSign size={60} className="text-green-500 mb-6" />
                <h3 className="text-2xl font-black text-zinc-500 uppercase">Arquivos</h3>
                <p className="text-8xl font-black text-white italic">{fotos.length + docs.length}</p>
              </div>
              <div className="bg-zinc-900/50 border-4 border-zinc-800 p-20 rounded-[5rem]">
                <Briefcase size={60} className="text-green-500 mb-6" />
                <h3 className="text-2xl font-black text-zinc-500 uppercase">Atividade</h3>
                <p className="text-5xl font-black text-white italic uppercase">{unidades.find(u => u.id === unidadeAtiva)?.atividade_principal}</p>
              </div>
           </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 border-4 border-zinc-800 rounded-[5rem] overflow-hidden">
                <img src={f.url_foto} className="w-full h-[600px] object-cover" />
                <div className="p-10 flex justify-between items-center bg-zinc-950">
                  <span className="text-white font-bold">{f.nome_arquivo}</span>
                  <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', f.id); carregarDados(); }} className="text-red-500"><Trash2 size={40}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
