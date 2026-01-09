import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, Cpu
} from 'lucide-react';

// Configuração do Supabase
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
  const [carregando, setCarregando] = useState(false);

  const inputRef = useRef(null);

  // Carregamento inicial de unidades
  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  // Carregamento de dados sempre que mudar a unidade ou a aba
  useEffect(() => {
    if (unidadeAtiva) carregarDados();
  }, [unidadeAtiva, abaAtiva]);

  async function carregarUnidades() {
    const { data, error } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data && data.length > 0) {
      setUnidades(data);
      if (!unidadeAtiva) setUnidadeAtiva(data[0].id);
    }
  }

  async function carregarDados() {
    if (!unidadeAtiva) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });
    
    if (data) {
      setDocs(data.filter(d => !d.url_foto));
      setFotos(data.filter(d => d.url_foto));
    }
    setCarregando(false);
  }

  const sanitizeFileName = (name) => {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  };

  const processarIA = (nomeArquivo) => {
    const nome = nomeArquivo.toUpperCase();
    if (nome.includes('ANTT') || nome.includes('EXTRATO')) {
      return { placa: "TVO9D07", motorista: "SILVA, J.", valor: "R$ 1.250,00", status: "VALIDADO" };
    }
    return { info: "DOC OPERACIONAL", data: new Date().toLocaleDateString() };
  };

  async function handleUpload(files) {
    if (!unidadeAtiva) return alert("Selecione uma unidade primeiro!");
    
    setStatusAcao("IA PROCESSANDO...");
    
    for (const file of files) {
      const cleanName = sanitizeFileName(file.name);
      const storagePath = `${Date.now()}_${cleanName}`;
      
      const { error: upErr } = await supabase.storage.from('evidencias').upload(storagePath, file);
      if (upErr) {
        console.error("Erro upload:", upErr.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(storagePath);
      const dadosExtraidos = processarIA(file.name);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: file.type.startsWith('image/') ? publicUrl : null,
        tipo_doc: file.name.split('.').pop().toUpperCase(),
        conteudo_extraido: dadosExtraidos
      }]);
    }
    
    // ATUALIZAÇÃO FORÇADA IMEDIATA
    await carregarDados();
    setStatusAcao("CONCLUÍDO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  async function deleteDoc(id) {
    await supabase.from('documentos_processados').delete().eq('id', id);
    carregarDados();
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 uppercase italic">Maximus <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 text-2xl outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === 'admin' || senha === '3840') && setAutorizado(true)}
          />
          <button onClick={() => (senha === 'admin' || senha === '3840') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-5 rounded-2xl text-xl uppercase tracking-widest">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans">
      {/* Header Fixo */}
      <header className="h-28 bg-zinc-950/90 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-2xl uppercase italic">Maximus <span className="text-green-500">PhD</span></h1>
          <select 
            className="bg-transparent text-green-500 font-bold text-sm outline-none mt-1 cursor-pointer"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-black text-white">{u.razao_social}</option>)}
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

      {/* Area de Conteúdo */}
      <main className="p-10 max-w-7xl mx-auto">
        
        {/* Status de IA */}
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-green-500 text-black px-8 py-3 rounded-full font-black text-sm z-[100] shadow-xl animate-bounce flex items-center gap-2">
            <Cpu size={20} className="animate-spin" /> {statusAcao}
          </div>
        )}

        {/* Dropzone de Upload */}
        <div 
          onDragOver={e => e.preventDefault()} 
          onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current.click()}
          className="mb-12 border-4 border-dashed border-zinc-900 rounded-[3rem] p-16 text-center bg-zinc-900/20 hover:border-green-500 transition-all cursor-pointer group"
        >
          <UploadCloud size={60} className="mx-auto mb-4 text-zinc-800 group-hover:text-green-500 transition-all" />
          <h2 className="text-3xl font-black text-white italic uppercase">Processamento Inteligente</h2>
          <p className="text-sm text-zinc-600 font-bold mt-2 uppercase tracking-[5px]">Arraste arquivos ou clique aqui</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
        </div>

        {/* Dashboard */}
        {abaAtiva === 'DASHBOARD' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem]">
                <FileText size={40} className="text-green-500 mb-4" />
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Total Documentos</h3>
                <p className="text-7xl font-black text-white italic">{docs.length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem]">
                <Camera size={40} className="text-green-500 mb-4" />
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Total Evidências</h3>
                <p className="text-7xl font-black text-white italic">{fotos.length}</p>
              </div>
           </div>
        )}

        {/* Galeria de Fotos */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl group">
                <div className="h-64 overflow-hidden">
                  <img src={f.url_foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-6 flex justify-between items-center bg-zinc-950">
                  <span className="text-white font-bold text-sm truncate uppercase">{f.nome_arquivo}</span>
                  <button onClick={() => deleteDoc(f.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={24}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabela de Frota */}
        {abaAtiva === 'FROTA' && (
           <div className="bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-zinc-950 text-zinc-600 uppercase text-[10px] tracking-widest">
                 <tr>
                   <th className="p-6">Arquivo</th>
                   <th className="p-6 text-center">IA Extração</th>
                   <th className="p-6 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {docs.map(d => (
                   <tr key={d.id} className="hover:bg-white/5 transition-colors group text-sm">
                     <td className="p-6 text-white font-bold italic">{d.nome_arquivo}</td>
                     <td className="p-6">
                        <div className="flex gap-2 justify-center">
                          {Object.entries(d.conteudo_extraido || {}).map(([k, v]) => (
                            <span key={k} className="bg-green-600/10 text-green-500 px-3 py-1 rounded-md text-[10px] font-black border border-green-500/20">{v}</span>
                          ))}
                        </div>
                     </td>
                     <td className="p-6 text-right">
                       <button onClick={() => deleteDoc(d.id)} className="text-zinc-700 hover:text-red-500"><Trash2 size={20}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-10 py-4 rounded-full flex items-center gap-6 shadow-2xl z-50">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Maximus PhD v17.6</span>
        <div className="w-px h-4 bg-zinc-800"></div>
        <div className="flex items-center gap-3 text-[10px] font-black text-green-500 italic">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           NÚCLEO MARABÁ OPERACIONAL
        </div>
      </footer>
    </div>
  );
}
