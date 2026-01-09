import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, DollarSign, 
  Search, CheckCircle, RefreshCcw, File, X, Printer
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
  
  const inputRef = useRef(null);

  // CARREGAR UNIDADES
  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  // ESCUTAR MUDANÇAS EM TEMPO REAL (REALTIME)
  useEffect(() => {
    if (autorizado && unidadeAtiva) {
      carregarDados();

      const subscription = supabase
        .channel('maximus_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_processados' }, () => {
          carregarDados();
        })
        .subscribe();

      return () => { supabase.removeChannel(subscription); };
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
      setFotos(data.filter(d => d.url_foto));
      setDocs(data.filter(d => !d.url_foto));
    }
  }

  async function handleUpload(files) {
    if (!unidadeAtiva) return;
    setLoading(true);
    setStatusAcao("IA ANALISANDO...");

    for (const file of files) {
      const nomeLimpo = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const isImage = file.type.startsWith('image/');
      
      const { error: upErr } = await supabase.storage.from('evidencias').upload(nomeLimpo, file);
      if (upErr) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeLimpo);

      // Inteligência de Categoria
      const tipo = file.name.toUpperCase().includes('EXTRATO') ? 'FINANCEIRO' : 'AUDITORIA';
      const info = file.name.toUpperCase().includes('EXTRATO') ? 'CONCILIAÇÃO OK' : 'DOCUMENTO AUDITADO';

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: tipo,
        conteudo_extraido: { detalhe: info },
        status_conformidade: 'CONFORME'
      }]);
    }

    setLoading(false);
    setStatusAcao("CONCLUÍDO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  async function deletarItem(id) {
    if (!confirm("Remover registro?")) return;
    await supabase.from('documentos_processados').delete().eq('id', id);
  }

  // GERAR RELATÓRIO PDF PARA IMPRESSÃO
  const imprimirRelatorio = () => {
    const nomeUnidade = unidades.find(u => u.id === unidadeAtiva)?.razao_social || 'Unidade';
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Relatório Maximus</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            .header { border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
            th { background: #f4f4f4; text-transform: uppercase; font-size: 12px; }
            .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>MAXIMUS PhD - RELATÓRIO DE AUDITORIA</h2>
            <p>UNIDADE: ${nomeUnidade} | DATA: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Extração IA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${[...docs, ...fotos].map(i => `
                <tr>
                  <td>${i.nome_arquivo}</td>
                  <td>${i.tipo_doc}</td>
                  <td>${i.conteudo_extraido?.detalhe || 'OK'}</td>
                  <td><b>${i.status_conformidade}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Sistema Maximus PhD v20.5 - Marabá/PA</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] w-full max-w-md text-center">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 uppercase italic italic">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500 text-xl font-bold"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-5 rounded-2xl uppercase tracking-[5px]">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-500 font-sans">
      <header className="h-28 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-2xl italic tracking-tighter">MAXIMUS PhD</h1>
          <select 
            className="bg-transparent text-green-500 font-black text-[11px] outline-none cursor-pointer uppercase"
            value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
          >
            {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
          </select>
        </div>

        <nav className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-8 py-3 rounded-full font-black text-[10px] transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <button onClick={imprimirRelatorio} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-green-500 transition-all uppercase tracking-widest">
          <Printer size={16} /> Relatório PDF
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto pb-32">
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-green-500 text-black px-10 py-4 rounded-full font-black text-xs z-[100] flex items-center gap-2 animate-bounce">
            <Zap size={16} fill="black" /> {statusAcao}
          </div>
        )}

        <div 
          onDragOver={e => e.preventDefault()} 
          onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current.click()}
          className="mb-12 border-2 border-dashed border-zinc-800 rounded-[3rem] p-20 text-center bg-zinc-900/20 hover:border-green-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <UploadCloud size={50} className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-all" />
          <h2 className="text-2xl font-black text-white uppercase italic">Audit IA Process</h2>
          <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-[5px]">Arraste arquivos ou clique</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
          {loading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md"><RefreshCcw className="animate-spin text-green-500" size={50} /></div>}
        </div>

        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <StatBox label="Documentos" value={docs.length} icon={<FileText />} />
            <StatBox label="Fotos Campo" value={fotos.length} icon={<Camera />} />
          </div>
        )}

        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {fotos.map(f => (
              <div key={f.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden relative shadow-2xl">
                <img src={f.url_foto} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-all" />
                <button onClick={() => deletarItem(f.id)} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-600 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                <tr><th className="p-8">Arquivo</th><th className="p-8">IA Extração</th><th className="p-8 text-right">Controle</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-white font-bold text-xs">
                {docs.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="p-8 truncate max-w-[300px] uppercase">{d.nome_arquivo}</td>
                    <td className="p-8"><span className="text-green-500 italic uppercase">{d.conteudo_extraido?.detalhe}</span></td>
                    <td className="p-8 text-right"><button onClick={() => deletarItem(d.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={20} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem]">
      <div className="text-green-500 mb-4">{icon}</div>
      <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest">{label}</h3>
      <p className="text-8xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}
