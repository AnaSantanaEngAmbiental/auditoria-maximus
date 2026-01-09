import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, CheckCircle, 
  RefreshCcw, File, Printer, Table as TableIcon, Search, Plus, X, LayoutGrid
} from 'lucide-react';

// Configuração do Cliente Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  // --- ESTADOS NUCLEARES ---
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [statusAcao, setStatusAcao] = useState('');
  
  // Dados do Banco
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtiva, setUnidadeAtiva] = useState('');
  const [todosDados, setTodosDados] = useState([]); // Fonte única de verdade
  
  // Filtros e Modais
  const [busca, setBusca] = useState('');
  const [showModalEmpresa, setShowModalEmpresa] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({ razao_social: '', cnpj: '', cidade: '' });
  
  const inputRef = useRef(null);

  // --- LÓGICA DE SINCRONIZAÇÃO CRITERIOSA ---
  useEffect(() => {
    if (autorizado) {
      carregarUnidades();
    }
  }, [autorizado]);

  useEffect(() => {
    if (unidadeAtiva) {
      carregarDados();
      // ESCUTA REALTIME ATIVA
      const canal = supabase.channel('audit_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_processados' }, () => carregarDados())
        .subscribe();
      return () => { supabase.removeChannel(canal); };
    }
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
    const { data } = await supabase.from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });
    if (data) setTodosDados(data);
  }

  // --- DERIVAÇÃO DE DADOS (CÁLCULO INSTANTÂNEO) ---
  const dadosFiltrados = useMemo(() => {
    return todosDados.filter(item => 
      item.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) ||
      (item.tipo_doc && item.tipo_doc.toLowerCase().includes(busca.toLowerCase()))
    );
  }, [todosDados, busca]);

  const fotos = dadosFiltrados.filter(d => d.url_foto);
  const documentos = dadosFiltrados.filter(d => !d.url_foto);
  const unidadeInfo = unidades.find(u => u.id === unidadeAtiva);

  // --- FUNCIONALIDADES CORE ---

  async function adicionarEmpresa() {
    if (!novaEmpresa.razao_social || !novaEmpresa.cnpj) return alert("Preencha Razão Social e CNPJ");
    setLoading(true);
    const { data, error } = await supabase.from('unidades_maximus').insert([novaEmpresa]).select();
    if (!error) {
      await carregarUnidades();
      setUnidadeAtiva(data[0].id);
      setShowModalEmpresa(false);
      setNovaEmpresa({ razao_social: '', cnpj: '', cidade: '' });
      setStatusAcao("EMPRESA CADASTRADA!");
    }
    setLoading(false);
  }

  async function handleUpload(files) {
    setLoading(true);
    setStatusAcao("PROCESSANDO...");
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const nomeLimpo = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { error: storageError } = await supabase.storage.from('evidencias').upload(nomeLimpo, file);
      if (storageError) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeLimpo);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: isImage ? 'FOTOGRAFICO' : 'AUDITORIA',
        status_conformidade: 'CONFORME',
        conteudo_extraido: { placa: 'IDENTIFICANDO...', modelo: 'SISTEMA' }
      }]);
    }
    await carregarDados(); // Sincronia imediata
    setLoading(false);
    setStatusAcao("CONCLUÍDO");
    setTimeout(() => setStatusAcao(''), 2000);
  }

  // --- INTERFACE ---

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-sm text-center backdrop-blur-3xl shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <ShieldCheck size={50} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-3xl mb-8 italic tracking-tighter">MAXIMUS <span className="text-green-500 italic">Ph.D.</span></h1>
          <input 
            type="password" placeholder="PIN DE ACESSO" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500 font-bold"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-4 rounded-2xl hover:bg-green-400 transition-all uppercase tracking-widest text-xs">Acessar Nucleo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-green-500 selection:text-black">
      
      {/* HEADER DINÂMICO */}
      <header className="bg-black/80 border-b border-zinc-900 sticky top-0 z-50 backdrop-blur-xl no-print">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-white font-black text-xl italic tracking-tighter">MAXIMUS <span className="text-green-500">Ph.D.</span></h1>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-transparent text-zinc-500 font-bold text-[10px] outline-none uppercase cursor-pointer hover:text-white transition-colors"
                  value={unidadeAtiva} 
                  onChange={(e) => setUnidadeAtiva(e.target.value)}
                >
                  {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
                </select>
                <button onClick={() => setShowModalEmpresa(true)} className="text-green-500 hover:scale-110 transition-transform"><Plus size={14}/></button>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input 
              type="text" placeholder="VARREDURA CRITERIOSA..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-4 text-white text-xs outline-none focus:border-green-600 transition-all"
            />
          </div>

          <nav className="flex gap-1 bg-zinc-900/80 p-1 rounded-full border border-zinc-800">
            {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
              <button 
                key={aba} 
                onClick={() => setAbaAtiva(aba)} 
                className={`px-5 py-2 rounded-full font-black text-[9px] transition-all tracking-tighter ${abaAtiva === aba ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-zinc-500 hover:text-white'}`}
              >
                {aba}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        
        {/* MODAL NOVA EMPRESA */}
        {showModalEmpresa && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-md">
              <div className="flex justify-between mb-8">
                <h2 className="text-white font-black italic text-xl">NOVA EMPRESA Ph.D.</h2>
                <button onClick={() => setShowModalEmpresa(false)}><X className="text-zinc-600 hover:text-white" /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="RAZÃO SOCIAL" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-green-500" onChange={e => setNovaEmpresa({...novaEmpresa, razao_social: e.target.value})}/>
                <input type="text" placeholder="CNPJ" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-green-500" onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})}/>
                <input type="text" placeholder="CIDADE/UF" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-green-500" onChange={e => setNovaEmpresa({...novaEmpresa, cidade: e.target.value})}/>
                <button onClick={adicionarEmpresa} className="w-full bg-green-600 text-black font-black py-4 rounded-xl hover:bg-green-400 transition-all text-[10px] uppercase tracking-widest">VALIDAR E SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-3 rounded-full font-black text-[10px] z-[100] shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle size={14} className="text-green-600" /> {statusAcao}
          </div>
        )}

        {/* ÁREA DE CONTEÚDO */}
        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] group hover:border-green-500/50 transition-all">
              <Camera className="text-zinc-700 group-hover:text-green-500 mb-4" size={32} />
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Mídias de Campo</h3>
              <p className="text-7xl font-black text-white italic tracking-tighter">{fotos.length}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] group hover:border-green-500/50 transition-all">
              <FileText className="text-zinc-700 group-hover:text-green-500 mb-4" size={32} />
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Docs Auditoria</h3>
              <p className="text-7xl font-black text-white italic tracking-tighter">{documentos.length}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] flex flex-col justify-center border-dashed border-zinc-700 hover:border-green-500 cursor-pointer" onClick={() => inputRef.current.click()}>
              <UploadCloud size={40} className="mx-auto text-zinc-800 mb-2" />
              <p className="text-center text-[9px] font-black uppercase tracking-widest">Arraste novos laudos aqui</p>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
            </div>
          </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 group hover:scale-[1.02] transition-all">
                <div className="h-48 overflow-hidden bg-black">
                  <img src={f.url_foto} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                </div>
                <div className="p-5 flex justify-between items-center bg-zinc-900">
                  <div className="truncate">
                    <p className="text-white font-black text-[9px] uppercase tracking-tighter truncate">{f.nome_arquivo}</p>
                    <p className="text-green-600 font-bold text-[8px] uppercase">{f.conteudo_extraido?.placa || 'PENDENTE'}</p>
                  </div>
                  <button onClick={() => supabase.from('documentos_processados').delete().eq('id', f.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black text-[10px] font-black text-zinc-600 border-b border-zinc-800 uppercase tracking-widest">
                <tr><th className="p-6">Documento de Frota</th><th className="p-6">Data Auditoria</th><th className="p-6 text-right">Controle</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-white font-bold text-xs uppercase">
                {documentos.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="p-6">{d.nome_arquivo}</td>
                    <td className="p-6 text-zinc-600">{new Date(d.data_leitura).toLocaleDateString()}</td>
                    <td className="p-6 text-right"><button onClick={() => supabase.from('documentos_processados').delete().eq('id', d.id)} className="text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'RELATORIOS' && (
          <div className="bg-white p-16 rounded-[4rem] text-black shadow-2xl max-w-5xl mx-auto print:p-0 print:shadow-none min-h-[1000px]">
             {/* ESTRUTURA IDÊNTICA AO ANEXO 7 */}
             <div className="border-b-4 border-black pb-8 mb-8 flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-black italic tracking-tighter leading-none">RELATÓRIO FOTOGRÁFICO</h1>
                   <p className="text-[10px] font-bold mt-1 uppercase tracking-[3px]">Processo de Auditoria Digital Ph.D.</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase">Unidade: {unidadeInfo?.razao_social}</p>
                   <p className="text-[10px] font-bold">CNPJ: {unidadeInfo?.cnpj}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-10">
                {fotos.map((f, idx) => (
                  <div key={f.id} className="border-2 border-zinc-100 p-4 rounded-2xl break-inside-avoid">
                     <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden mb-4">
                        <img src={f.url_foto} className="w-full h-full object-cover" />
                     </div>
                     <div className="bg-black text-white p-3 rounded-xl flex justify-between items-center">
                        <span className="text-[9px] font-black italic">FOTO {String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-[9px] font-black uppercase">PLACA: {f.conteudo_extraido?.placa || 'EVIDÊNCIA'}</span>
                     </div>
                     <p className="text-[8px] font-bold mt-2 uppercase text-zinc-500">Arquivo: {f.nome_arquivo}</p>
                  </div>
                ))}
             </div>

             <div className="mt-20 pt-10 border-t border-zinc-200 flex justify-between items-center no-print">
                <p className="text-[9px] font-bold text-zinc-400">Geração Automática Maximus Ph.D. v25.0</p>
                <button onClick={() => window.print()} className="bg-black text-white px-10 py-4 rounded-full font-black text-xs hover:bg-zinc-800 transition-all flex items-center gap-3">
                   <Printer size={16} /> EMITIR RELATÓRIO OFICIAL
                </button>
             </div>
          </div>
        )}

      </main>

      <footer className="fixed bottom-0 w-full bg-black/95 border-t border-zinc-900 p-6 flex justify-between items-center z-50 no-print">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-zinc-700 tracking-[8px] uppercase">Kernel Audit v25.0</span>
        </div>
        <div className="text-[9px] font-black text-zinc-500 italic">Total de Ativos: {todosDados.length}</div>
      </footer>

      <style>{`
        @media print {
          body { background: white !important; padding: 0 !important; }
          .no-print { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          .print\:p-0 { padding: 0 !important; }
          .print\:shadow-none { shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
