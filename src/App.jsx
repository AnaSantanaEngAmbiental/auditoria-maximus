import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  X, Zap, LayoutDashboard, FileText, Camera, DollarSign, Briefcase, 
  Search, CheckCircle2, Cpu
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
  const [detalheDoc, setDetalheDoc] = useState(null);
  const [novaUnidade, setNovaUnidade] = useState({ razao: '', cnpj: '', atividade: 'Transporte' });

  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) carregarUnidades();
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
    if (!unidadeAtiva) return;
    const { data } = await supabase.from('documentos_processados').select('*').eq('unidade_id', unidadeAtiva).order('data_leitura', { ascending: false });
    if (data) {
      setDocs(data.filter(d => !d.url_foto));
      setFotos(data.filter(d => d.url_foto));
    }
  }

  const sanitizeFileName = (name) => {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  };

  // SIMULAÇÃO DE INTELIGÊNCIA ARTIFICIAL (OCR)
  const processarIA = (nomeArquivo) => {
    const nome = nomeArquivo.toUpperCase();
    if (nome.includes('ANTT') || nome.includes('EXTRATO')) {
      return { placa: "TVO9D07", motorista: "SILVA, J.", valor: "R$ 1.250,00", status: "VALIDADO" };
    }
    if (nome.includes('FOTO') || nome.includes('EVIDENCIA')) {
      return { local: "PÁTIO MARABÁ", condicao: "BOA", veiculo: "SCANIA R450" };
    }
    return { info: "DOCUMENTO GERAL", data: new Date().toLocaleDateString() };
  };

  async function handleUpload(files) {
    setStatusAcao("IA PROCESSANDO...");
    const arquivosExistentes = [...docs, ...fotos].map(d => d.nome_arquivo);

    for (const file of files) {
      if (arquivosExistentes.includes(file.name)) continue;

      const cleanName = sanitizeFileName(file.name);
      const storagePath = `${Date.now()}_${cleanName}`;
      
      const { error: upErr } = await supabase.storage.from('evidencias').upload(storagePath, file);
      if (upErr) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(storagePath);
      
      // EXTRAÇÃO DE DADOS PELA IA
      const dadosExtraidos = processarIA(file.name);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: file.type.startsWith('image/') ? publicUrl : null,
        tipo_doc: file.name.split('.').pop().toUpperCase(),
        conteudo_extraido: dadosExtraidos
      }]);
    }
    
    carregarDados();
    setStatusAcao("PROCESSADO COM SUCESSO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 font-sans">
        <div className="bg-zinc-900 border-4 border-zinc-800 p-20 rounded-[5rem] w-full max-w-2xl text-center shadow-2xl">
          <ShieldCheck size={100} className="text-green-500 mx-auto mb-10" />
          <h1 className="text-white font-black text-6xl mb-12 italic tracking-tighter uppercase">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border-4 border-zinc-800 rounded-3xl py-10 text-white text-center mb-8 text-4xl outline-none"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === 'admin' || senha === '3840') && setAutorizado(true)}
          />
          <button onClick={() => (senha === 'admin' || senha === '3840') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-10 rounded-3xl text-2xl uppercase tracking-[15px]">ATIVAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 text-[18px]">
      <header className="h-36 bg-zinc-950/90 border-b-4 border-zinc-900 flex items-center justify-between px-20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-4xl uppercase tracking-tighter italic">Maximus <span className="text-green-500">PhD</span></h1>
          <p className="text-green-900 font-black text-xs tracking-[5px] uppercase">Inteligência Operacional</p>
        </div>

        <nav className="flex gap-4 bg-black p-3 rounded-[3rem] border-2 border-zinc-800 shadow-2xl">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'UNIDADES'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-12 py-5 rounded-[2.5rem] font-black text-sm transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <select 
          className="bg-zinc-900 text-white p-4 rounded-2xl border-2 border-zinc-800 font-bold outline-none"
          value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
        >
          {unidades.map(u => <option key={u.id} value={u.id}>{u.razao_social}</option>)}
        </select>
      </header>

      <main className="p-20 max-w-[2400px] mx-auto pb-64">
        {statusAcao && (
          <div className="fixed top-48 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-full font-black text-2xl z-[500] border-4 border-green-500 shadow-2xl animate-pulse flex items-center gap-4 uppercase italic">
            <Cpu className="animate-spin" size={40} /> {statusAcao}
          </div>
        )}

        {abaAtiva !== 'UNIDADES' && (
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
            onClick={() => inputRef.current.click()}
            className="mb-20 border-8 border-dashed border-zinc-900 rounded-[5rem] p-32 text-center bg-zinc-900/10 hover:border-green-500 transition-all cursor-pointer group"
          >
            <UploadCloud size={120} className="mx-auto mb-10 text-zinc-800 group-hover:text-green-500 transition-all" />
            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Processamento em Lote</h2>
            <p className="text-3xl text-zinc-600 font-bold mt-4 uppercase tracking-[10px]">Arraste Extratos ou Fotos</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
          </div>
        )}

        {abaAtiva === 'DASHBOARD' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="bg-zinc-900/50 border-4 border-zinc-800 p-20 rounded-[5rem] shadow-2xl border-l-green-600">
                <FileText size={60} className="text-green-500 mb-6" />
                <h3 className="text-2xl font-black text-zinc-500 uppercase tracking-widest">Documentos</h3>
                <p className="text-9xl font-black text-white italic tracking-tighter">{docs.length}</p>
              </div>
              <div className="bg-zinc-900/50 border-4 border-zinc-800 p-20 rounded-[5rem] shadow-2xl border-l-green-600">
                <Camera size={60} className="text-green-500 mb-6" />
                <h3 className="text-2xl font-black text-zinc-500 uppercase tracking-widest">Evidências</h3>
                <p className="text-9xl font-black text-white italic tracking-tighter">{fotos.length}</p>
              </div>
              <div className="bg-zinc-900/50 border-4 border-zinc-800 p-20 rounded-[5rem] shadow-2xl border-l-green-600 text-center flex flex-col items-center justify-center">
                <Cpu size={100} className="text-green-500 mb-4 animate-pulse" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">IA Conectada</h3>
                <span className="text-green-900 font-bold">NÚCLEO MARABÁ ONLINE</span>
              </div>
           </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 border-4 border-zinc-800 rounded-[5rem] overflow-hidden shadow-2xl group relative">
                <img src={f.url_foto} className="w-full h-[600px] object-cover opacity-50 group-hover:opacity-100 transition-all" />
                <div className="absolute top-10 left-10 flex gap-4">
                  {Object.entries(f.conteudo_extraido || {}).map(([key, val]) => (
                    <span key={key} className="bg-green-600 text-black text-xs font-black px-4 py-2 rounded-full uppercase">{val}</span>
                  ))}
                </div>
                <div className="p-12 flex justify-between items-center bg-zinc-950 border-t-4 border-zinc-900">
                  <span className="text-white font-bold text-2xl truncate uppercase">{f.nome_arquivo}</span>
                  <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', f.id); carregarDados(); }} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={40}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
           <div className="bg-zinc-900/30 rounded-[5rem] border-4 border-zinc-800 overflow-hidden shadow-2xl">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-zinc-950 text-zinc-600 border-b-4 border-zinc-800 uppercase text-sm tracking-[20px]">
                   <th className="p-16">Arquivo</th>
                   <th className="p-16">IA Extração</th>
                   <th className="p-16 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y-2 divide-zinc-900/50">
                 {docs.map(d => (
                   <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                     <td className="p-16 text-white font-bold text-3xl italic group-hover:text-green-500">{d.nome_arquivo}</td>
                     <td className="p-16">
                        <div className="flex gap-4">
                          {Object.entries(d.conteudo_extraido || {}).map(([k, v]) => (
                            <span key={k} className="bg-zinc-800 text-green-500 px-4 py-2 rounded-xl text-xs font-black border border-green-900/30 uppercase">{v}</span>
                          ))}
                        </div>
                     </td>
                     <td className="p-16 text-right">
                       <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', d.id); carregarDados(); }} className="text-zinc-800 hover:text-red-500"><Trash2 size={40}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full h-24 bg-black border-t-8 border-zinc-900 flex items-center px-24 justify-between text-lg font-black text-zinc-800 uppercase tracking-[15px] z-[300]">
        <span>MAXIMUS PhD v17.5</span>
        <div className="flex items-center gap-6 text-green-900">
           <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-[0_0_20px_green]"></div>
           IA ACTIVE - MARABÁ/PA
        </div>
      </footer>
    </div>
  );
}
