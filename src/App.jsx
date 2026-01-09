import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Zap, Camera, FileText, 
  Printer, Plus, Search, RefreshCcw, X, Table as TableIcon 
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [statusAcao, setStatusAcao] = useState('');
  
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtiva, setUnidadeAtiva] = useState('');
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [showModalEmpresa, setShowModalEmpresa] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({ razao_social: '', cnpj: '', logradouro: '', nome_fantasia: '' });
  
  const inputRef = useRef(null);

  useEffect(() => { if (autorizado) carregarUnidades(); }, [autorizado]);
  useEffect(() => { if (unidadeAtiva) carregarDados(); }, [unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data) {
      setUnidades(data);
      if (data.length > 0 && !unidadeAtiva) setUnidadeAtiva(data[0].id);
    }
  }

  // CORREÇÃO DO ERRO 400: Pedindo apenas colunas que existem no novo SQL
  async function carregarDados() {
    if (!unidadeAtiva) return;
    const { data, error } = await supabase
      .from('documentos_processados')
      .select('id, nome_arquivo, url_foto, tipo_doc, placa, modelo_veiculo, data_leitura, status_conformidade')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });
    
    if (error) {
      console.error("Erro na leitura:", error);
      return;
    }
    setItems(data || []);
  }

  async function salvarEmpresa() {
    if (!novaEmpresa.razao_social || !novaEmpresa.cnpj) return alert("Razão Social e CNPJ são obrigatórios!");
    setLoading(true);
    setStatusAcao("REGISTRANDO UNIDADE...");
    
    const { data, error } = await supabase.from('unidades_maximus').insert([novaEmpresa]).select();
    
    if (!error) {
      await carregarUnidades();
      setUnidadeAtiva(data[0].id);
      setShowModalEmpresa(false);
      setStatusAcao("UNIDADE SALVA!");
    } else {
      alert("Erro: " + error.message);
    }
    setLoading(false);
    setTimeout(() => setStatusAcao(''), 2000);
  }

  async function handleUpload(files) {
    if (!unidadeAtiva) return alert("Selecione uma empresa!");
    setLoading(true);
    let duplicados = 0;

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      setStatusAcao(`VERIFICANDO: ${file.name}`);

      // 1. Trava de Duplicidade no Banco
      const { data, error } = await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        tipo_doc: isImage ? 'FOTO' : 'DOC',
        placa: 'PENDENTE',
        modelo_veiculo: 'EM ANÁLISE'
      }]).select();

      if (error && error.code === '23505') {
        duplicados++;
        continue;
      }

      // 2. Upload para Storage
      if (data) {
        const path = `${unidadeAtiva}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('evidencias').upload(path, file);
        
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(path);
          await supabase.from('documentos_processados').update({ url_foto: isImage ? publicUrl : null }).eq('id', data[0].id);
        }
      }
    }

    await carregarDados();
    setLoading(false);
    setStatusAcao(duplicados > 0 ? `${duplicados} ARQUIVOS JÁ EXISTENTES IGNORADOS` : "PROCESSAMENTO CONCLUÍDO!");
    setTimeout(() => setStatusAcao(''), 3000);
  }

  async function deletarItem(id) {
    if (!confirm("Excluir este registro permanentemente?")) return;
    await supabase.from('documentos_processados').delete().eq('id', id);
    await carregarDados();
  }

  const unidadeInfo = unidades.find(u => u.id === unidadeAtiva);
  const fotos = items.filter(i => i.tipo_doc === 'FOTO' && i.nome_arquivo.toLowerCase().includes(busca.toLowerCase()));
  const docs = items.filter(i => i.tipo_doc === 'DOC' && i.nome_arquivo.toLowerCase().includes(busca.toLowerCase()));

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-zinc-900 p-12 rounded-[3rem] border border-zinc-800 text-center w-80 shadow-2xl">
          <ShieldCheck size={50} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black italic mb-8 uppercase tracking-tighter">MAXIMUS PhD</h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-center mb-6 outline-none focus:border-green-600"
            onKeyDown={e => e.key === 'Enter' && (e.target.value === '3840' || e.target.value === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => setAutorizado(true)} className="w-full bg-green-600 p-4 rounded-2xl font-black text-black uppercase text-[10px] tracking-widest">Acessar Painel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-500 font-sans">
      <header className="h-24 bg-black/90 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 no-print backdrop-blur-lg">
        <div className="flex flex-col">
          <span className="text-white font-black italic text-xl uppercase tracking-tighter">MAXIMUS PhD</span>
          <div className="flex items-center gap-2">
            <select className="bg-transparent text-green-500 text-[10px] font-black outline-none cursor-pointer" value={unidadeAtiva} onChange={e => setUnidadeAtiva(e.target.value)}>
              {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
            </select>
            <button onClick={() => setShowModalEmpresa(true)} className="text-zinc-700 hover:text-white"><Plus size={16}/></button>
          </div>
        </div>

        <nav className="flex gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-6 py-2 rounded-full text-[9px] font-black transition-all ${abaAtiva === aba ? 'bg-green-600 text-black shadow-lg shadow-green-900/20' : 'hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
          <input className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-[10px] outline-none focus:border-green-600 uppercase" placeholder="Buscar ativos..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {statusAcao && (
          <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-3 rounded-full font-black text-[10px] z-[100] shadow-2xl animate-bounce">
            <Zap size={14} className="inline mr-2 text-green-600" fill="currentColor"/> {statusAcao}
          </div>
        )}

        {showModalEmpresa && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-md">
              <h2 className="text-white font-black text-xl mb-8 uppercase italic">Nova Unidade Operacional</h2>
              <div className="space-y-4">
                <input placeholder="RAZÃO SOCIAL" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-bold outline-none text-xs" onChange={e => setNovaEmpresa({...novaEmpresa, razao_social: e.target.value.toUpperCase()})}/>
                <input placeholder="CNPJ" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-bold outline-none text-xs" onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})}/>
                <input placeholder="ENDEREÇO" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-bold outline-none text-xs" onChange={e => setNovaEmpresa({...novaEmpresa, logradouro: e.target.value.toUpperCase()})}/>
                <button onClick={salvarEmpresa} className="w-full bg-green-600 text-black font-black py-5 rounded-xl text-xs uppercase mt-4">Confirmar</button>
                <button onClick={() => setShowModalEmpresa(false)} className="w-full text-[10px] font-bold">CANCELAR</button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-zinc-900/30 border border-zinc-800 p-20 rounded-[4rem] text-center">
              <Camera className="mx-auto mb-6 text-zinc-800" size={40} />
              <p className="text-9xl font-black text-white italic tracking-tighter">{fotos.length}</p>
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[10px]">Fotos Auditadas</h3>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 p-20 rounded-[4rem] text-center">
              <FileText className="mx-auto mb-6 text-zinc-800" size={40} />
              <p className="text-9xl font-black text-white italic tracking-tighter">{docs.length}</p>
              <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[10px]">Documentos</h3>
            </div>
          </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {fotos.map(f => (
              <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden group">
                <img src={f.url_foto} className="w-full h-64 object-cover opacity-60 group-hover:opacity-100 transition-all" />
                <div className="p-4 bg-zinc-950 flex justify-between items-center border-t border-zinc-800">
                   <span className="text-[9px] font-black text-white uppercase truncate w-32">{f.nome_arquivo}</span>
                   <button onClick={() => deletarItem(f.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black text-[10px] font-black text-zinc-700 border-b border-zinc-800 uppercase tracking-widest">
                <tr><th className="p-8">Documento Digital</th><th className="p-8">Data</th><th className="p-8 text-right">Ação</th></tr>
              </thead>
              <tbody className="text-white font-bold text-xs uppercase">
                {docs.map(d => (
                  <tr key={d.id} className="border-b border-zinc-800/10 hover:bg-white/[0.02]">
                    <td className="p-8">{d.nome_arquivo}</td>
                    <td className="p-8 text-zinc-700">{new Date(d.data_leitura).toLocaleDateString()}</td>
                    <td className="p-8 text-right"><button onClick={() => deletarItem(d.id)} className="text-red-900 hover:text-red-500"><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'RELATORIOS' && (
          <div className="bg-white text-black p-0 rounded-[2.5rem] max-w-5xl mx-auto shadow-2xl overflow-hidden print:shadow-none min-h-screen">
            <div className="p-12 border-b-[8px] border-black bg-zinc-50">
               <div className="flex justify-between items-center mb-10">
                  <h1 className="text-3xl font-black italic uppercase leading-none border-l-[12px] border-black pl-6">Relatório Fotográfico</h1>
                  <button onClick={() => window.print()} className="no-print bg-black text-white px-10 py-4 rounded-xl font-black text-[11px] flex items-center gap-2 hover:bg-green-600 transition-all">
                    <Printer size={18}/> GERAR PDF
                  </button>
               </div>
               <div className="grid grid-cols-2 gap-8 text-[12px] font-bold uppercase">
                  <div className="border-b-2 border-zinc-200 py-2"><span className="text-zinc-400 text-[9px] block">Razão Social:</span> {unidadeInfo?.razao_social}</div>
                  <div className="border-b-2 border-zinc-200 py-2"><span className="text-zinc-400 text-[9px] block">CNPJ:</span> {unidadeInfo?.cnpj}</div>
                  <div className="border-b-2 border-zinc-200 py-2"><span className="text-zinc-400 text-[9px] block">Localidade:</span> {unidadeInfo?.logradouro}</div>
                  <div className="border-b-2 border-zinc-200 py-2"><span className="text-zinc-400 text-[9px] block">Data Emissão:</span> {new Date().toLocaleDateString()}</div>
               </div>
            </div>

            <div className="p-12 grid grid-cols-2 gap-10">
               {fotos.map((f, idx) => (
                 <div key={f.id} className="border-[4px] border-zinc-100 p-6 rounded-[3rem] break-inside-avoid shadow-sm">
                    <img src={f.url_foto} className="w-full h-60 object-cover rounded-[2rem] mb-6" />
                    <div className="bg-black text-white p-4 rounded-2xl flex justify-between font-black text-[10px] italic">
                       <span>FOTO {String(idx + 1).padStart(2, '0')}</span>
                       <span>PLACA: {f.placa}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {abaAtiva !== 'RELATORIOS' && (
          <div 
            onClick={() => inputRef.current.click()}
            className="mt-12 border-2 border-dashed border-zinc-800 p-20 rounded-[4rem] text-center cursor-pointer hover:border-green-600 transition-all bg-zinc-900/5 group no-print"
          >
            <UploadCloud size={50} className="mx-auto mb-6 text-zinc-800 group-hover:text-green-500" />
            <h2 className="text-white font-black uppercase italic tracking-[10px] text-xs font-bold">Upload de Ativos para Auditoria</h2>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
            {loading && <div className="mt-8 animate-pulse text-green-500 font-black text-[10px] uppercase">Sincronizando Banco de Dados...</div>}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full p-6 text-center text-[7px] font-black text-zinc-900 tracking-[15px] uppercase no-print">
        Maximus PhD Core Engine v31.0
      </footer>
    </div>
  );
}
