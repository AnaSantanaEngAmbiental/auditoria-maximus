import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, DollarSign, 
  Search, CheckCircle, RefreshCcw, File, X, AlertTriangle
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
    const { data, error } = await supabase
      .from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });

    if (data) {
      const imagens = data.filter(d => d.url_foto && d.url_foto.match(/\.(jpg|jpeg|png|webp)$/i));
      const arquivos = data.filter(d => !d.url_foto || !d.url_foto.match(/\.(jpg|jpeg|png|webp)$/i));
      setFotos(imagens);
      setDocs(arquivos);
    }
  }

  // SIMULAÇÃO DE IA: Extrai dados baseados no nome do arquivo ou conteúdo
  const simularIAExtração = (nomeArquivo) => {
    if (nomeArquivo.toUpperCase().includes('EXTRATO')) {
      return { tipo: 'FINANCEIRO', info: 'R$ 1.250,00 - VALIDADO', status: 'CONFORME' };
    }
    if (nomeArquivo.toUpperCase().includes('RELATORIO')) {
      return { tipo: 'AUDITORIA', info: 'TÉCNICO: SILVA, J.', status: 'AUDITADO' };
    }
    return { tipo: 'OUTROS', info: 'ANEXO GERAL', status: 'PENDENTE' };
  };

  async function handleUpload(files) {
    if (!unidadeAtiva) return;
    setLoading(true);
    setStatusAcao("PROCESSANDO IA...");

    for (const file of files) {
      const nomeLimpo = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
      const caminhoStorage = `${Date.now()}_${nomeLimpo}`;
      const isImage = file.type.startsWith('image/');

      // 1. Upload para o Storage
      const { error: upErr } = await supabase.storage.from('evidencias').upload(caminhoStorage, file);
      if (upErr) {
        console.error("Erro storage:", upErr);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(caminhoStorage);

      // 2. Extração de Dados via "IA"
      const analiseIA = simularIAExtração(file.name);

      // 3. Salvar no Banco (com tratamento de erro 409)
      const { error: dbErr } = await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: analiseIA.tipo,
        conteudo_extraido: { detalhe: analiseIA.info },
        status_conformidade: analiseIA.status
      }]);

      if (dbErr && dbErr.code === '23505') {
        console.warn("Arquivo já registrado:", file.name);
      }
    }

    await carregarDados();
    setLoading(false);
    setStatusAcao("CONCLUÍDO!");
    setTimeout(() => setStatusAcao(""), 3000);
  }

  async function deletarItem(id, url) {
    if(confirm("Deseja excluir este registro?")) {
      await supabase.from('documentos_processados').delete().eq('id', id);
      // Opcional: deletar do storage também se necessário
      carregarDados();
    }
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl text-center">
          <ShieldCheck size={50} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-white font-black text-3xl mb-6 italic tracking-tighter">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA DE ACESSO" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-4 outline-none focus:border-green-500 transition-all"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button 
            onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)}
            className="w-full bg-green-600 text-black font-black py-4 rounded-2xl hover:bg-green-500 transition-all uppercase tracking-widest text-sm"
          >
            Acessar Núcleo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-green-500 selection:text-black">
      {/* HEADER */}
      <header className="h-24 bg-black/80 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-xl italic tracking-tighter">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <div className="flex items-center gap-2">
            <Building2 size={12} className="text-zinc-600" />
            <select 
              className="bg-transparent text-zinc-500 font-bold text-[10px] outline-none cursor-pointer uppercase hover:text-white transition-all"
              value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
            >
              {unidades.map(u => <option key={u.id} value={u.id} className="bg-black text-white">{u.razao_social}</option>)}
            </select>
          </div>
        </div>

        <nav className="flex gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/50">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA'].map(aba => (
            <button 
              key={aba} onClick={() => setAbaAtiva(aba)} 
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] transition-all tracking-widest ${abaAtiva === aba ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-zinc-500 hover:text-white'}`}
            >
              {aba}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-8 max-w-7xl mx-auto">
        
        {/* FEEDBACK DE AÇÃO */}
        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-3 rounded-full font-black text-[10px] z-[100] shadow-2xl flex items-center gap-3 animate-bounce">
            <Zap size={14} className="fill-current" /> {statusAcao}
          </div>
        )}

        {/* ÁREA DE UPLOAD */}
        <div 
          onDragOver={e => e.preventDefault()} 
          onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current.click()}
          className="mb-10 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-16 text-center bg-zinc-900/20 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer group relative overflow-hidden"
        >
          <UploadCloud size={40} className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-all" />
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Processamento em Lote</h2>
          <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase tracking-[3px]">Arraste Extratos ou Fotos</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
          {loading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><RefreshCcw className="animate-spin text-green-500" size={40} /></div>}
        </div>

        {/* DASHBOARD VIEW */}
        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            <StatCard icon={<FileText />} label="Documentos" value={docs.length} color="text-blue-500" />
            <StatCard icon={<Camera />} label="Evidências" value={fotos.length} color="text-green-500" />
            <StatCard icon={<CheckCircle />} label="Conformidade" value="100%" color="text-yellow-500" />
          </div>
        )}

        {/* FOTOGRAFICO VIEW */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {fotos.map(f => (
              <div key={f.id} className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-lg">
                <img src={f.url_foto} className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-700 opacity-80 group-hover:opacity-100" />
                <div className="p-4 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800">
                  <p className="text-[10px] font-bold text-white truncate uppercase">{f.nome_arquivo}</p>
                  <p className="text-[8px] text-green-500 font-black mt-1 uppercase">{f.status_conformidade}</p>
                </div>
                <button onClick={() => deletarItem(f.id)} className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FROTA / DOCUMENTOS VIEW */}
        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/50 text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                <tr>
                  <th className="p-5 border-b border-zinc-800">Arquivo</th>
                  <th className="p-5 border-b border-zinc-800">IA Extração</th>
                  <th className="p-5 border-b border-zinc-800 text-center">Status</th>
                  <th className="p-5 border-b border-zinc-800 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {docs.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><File size={16} /></div>
                        <span className="text-zinc-200 font-bold text-xs uppercase truncate max-w-[200px]">{d.nome_arquivo}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black text-white italic">{d.conteudo_extraido?.detalhe || '---'}</span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase">{d.status_conformidade}</span>
                    </td>
                    <td className="p-5 text-right">
                      <button onClick={() => deletarItem(d.id)} className="text-zinc-700 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-zinc-900 px-10 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">v18.5 IA ACTIVE</span>
          <div className="h-3 w-px bg-zinc-800"></div>
          <p className="text-[9px] font-black text-green-500 uppercase">Núcleo Marabá/PA</p>
        </div>
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-zinc-700 transition-all">
      <div className={`${color} mb-3 opacity-50`}>{icon}</div>
      <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">{label}</h3>
      <p className="text-5xl font-black text-white italic tracking-tighter mt-1">{value}</p>
    </div>
  );
}
