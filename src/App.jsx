import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, 
  FileText, Camera, Cpu, RefreshCw
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
  const [frota, setFrota] = useState([]);
  const [statusAcao, setStatusAcao] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  // Carrega tudo automaticamente ao mudar de aba ou unidade
  useEffect(() => {
    if (unidadeAtiva) carregarDados();
  }, [unidadeAtiva, abaAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data && data.length > 0) {
      setUnidades(data);
      if (!unidadeAtiva) setUnidadeAtiva(data[0].id);
    }
  }

  async function carregarDados() {
    if (!unidadeAtiva) return;
    
    // Busca Documentos e Fotos
    const { data: documentos } = await supabase
      .from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('created_at', { ascending: false });
    
    // Busca Frota (Tabela que você já tem no Supabase)
    const { data: veiculos } = await supabase
      .from('frota_veiculos')
      .select('*');

    if (documentos) {
      setDocs(documentos.filter(d => !d.url_foto));
      setFotos(documentos.filter(d => d.url_foto));
    }
    if (veiculos) setFrota(veiculos);
  }

  async function handleUpload(files) {
    setStatusAcao("PROCESSANDO IA...");
    
    for (const file of files) {
      const storagePath = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('evidencias').upload(storagePath, file);
      
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(storagePath);
        
        // Simulação de OCR baseada no nome
        const extraido = file.name.includes('ANTT') 
          ? { placa: "TVO9D07", motorista: "SILVA, J.", status: "OK" }
          : { info: "EVIDÊNCIA VISUAL", data: new Date().toLocaleDateString() };

        await supabase.from('documentos_processados').insert([{
          unidade_id: unidadeAtiva,
          nome_arquivo: file.name,
          url_foto: file.type.startsWith('image/') ? publicUrl : null,
          tipo_doc: file.name.split('.').pop().toUpperCase(),
          conteudo_extraido: extraido
        }]);
      }
    }
    
    // O SEGREDO: Atualiza o estado local IMEDIATAMENTE após o loop
    await carregarDados();
    setStatusAcao("SUCESSO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2rem] w-full max-w-sm text-center">
          <ShieldCheck size={50} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-6 italic">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-xl py-4 text-center mb-4 text-xl outline-none focus:border-green-500"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === 'admin' || senha === '3840') && setAutorizado(true)}
          />
          <button onClick={() => (senha === 'admin' || senha === '3840') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-4 rounded-xl uppercase">Acessar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans pb-32">
      {/* Header com Tailwind fixo */}
      <header className="h-24 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between px-8 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-xl italic uppercase">Maximus <span className="text-green-500">PhD</span></h1>
          <select 
            className="bg-transparent text-green-600 font-bold text-xs outline-none"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-black text-white">{u.razao_social}</option>)}
          </select>
        </div>

        <nav className="flex gap-1 bg-zinc-900 p-1 rounded-full border border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA'].map(aba => (
            <button 
              key={aba} onClick={() => setAbaAtiva(aba)} 
              className={`px-6 py-2 rounded-full font-black text-[10px] transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {aba}
            </button>
          ))}
        </nav>
        
        <button onClick={carregarDados} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-green-500">
          <RefreshCw size={20} />
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-black text-xs z-[100] flex items-center gap-2 shadow-2xl border border-green-500">
            <Cpu size={16} className="animate-spin" /> {statusAcao}
          </div>
        )}

        {/* Dropzone Corrigida */}
        <div 
          onDragOver={e => e.preventDefault()} 
          onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current.click()}
          className="mb-10 border-2 border-dashed border-zinc-800 rounded-[2rem] p-12 text-center bg-zinc-900/10 hover:border-green-600 transition-all cursor-pointer"
        >
          <UploadCloud size={40} className="mx-auto mb-2 text-zinc-700" />
          <h2 className="text-xl font-black text-white uppercase italic">Área de Processamento</h2>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Clique ou arraste documentos aqui</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
        </div>

        {/* Dashboard Resumo */}
        {abaAtiva === 'DASHBOARD' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
                <FileText className="text-green-500 mb-2" />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase">Documentos</h3>
                <p className="text-5xl font-black text-white">{docs.length}</p>
              </div>
              <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
                <Camera className="text-green-500 mb-2" />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase">Fotos/Evidências</h3>
                <p className="text-5xl font-black text-white">{fotos.length}</p>
              </div>
              <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
                <Cpu className="text-green-500 mb-2" />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase">Frota Detectada</h3>
                <p className="text-5xl font-black text-white">{frota.length}</p>
              </div>
           </div>
        )}

        {/* Fotos - Carregamento Instantâneo */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                <img src={f.url_foto} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100" />
                <button 
                  onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', f.id); carregarDados(); }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Frota e Documentos */}
        {abaAtiva === 'FROTA' && (
           <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
             <table className="w-full text-left text-xs">
               <thead className="bg-black text-zinc-600 uppercase font-black">
                 <tr>
                   <th className="p-4">Arquivo / Documento</th>
                   <th className="p-4 text-center">IA OCR</th>
                   <th className="p-4 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {docs.map(d => (
                   <tr key={d.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 text-white font-bold">{d.nome_arquivo}</td>
                     <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {Object.entries(d.conteudo_extraido || {}).map(([k, v]) => (
                            <span key={k} className="bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 font-black uppercase text-[9px]">{v}</span>
                          ))}
                        </div>
                     </td>
                     <td className="p-4 text-right">
                       <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', d.id); carregarDados(); }} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center justify-center px-10">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-700 uppercase italic">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           Maximus PhD v17.7 - Marabá Operacional Ativo
        </div>
      </footer>
    </div>
  );
}
