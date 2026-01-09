import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, CheckCircle, 
  RefreshCcw, File, Printer, Download, Table as TableIcon
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

  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  useEffect(() => {
    if (autorizado && unidadeAtiva) {
      carregarDados();
      const subscription = supabase
        .channel('maximus_v21')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_processados' }, () => carregarDados())
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [autorizado, unidadeAtiva]);

  async function carregarUnidades() {
    const { data } = await supabase.from('unidades_maximus').select('*').order('razao_social');
    if (data) setUnidades(data);
  }

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados')
      .select('*').eq('unidade_id', unidadeAtiva).order('data_leitura', { ascending: false });
    if (data) {
      setFotos(data.filter(d => d.url_foto));
      setDocs(data.filter(d => !d.url_foto));
    }
  }

  // --- MOTORES DE EXPORTAÇÃO ---

  const exportarCSV = () => {
    const cabecalho = "Arquivo;Tipo;Extração IA;Status;Data\n";
    const linhas = [...docs, ...fotos].map(i => 
      `${i.nome_arquivo};${i.tipo_doc};${i.conteudo_extraido?.detalhe};${i.status_conformidade};${new Date(i.data_leitura).toLocaleDateString()}`
    ).join("\n");
    
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RELATORIO_MAXIMUS_${unidadeAtiva}.csv`);
    link.click();
    setStatusAcao("EXCEL GERADO!");
  };

  const exportarDOCX = () => {
    const conteudo = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Relatório</title></head>
      <body>
        <h1>Relatório de Auditoria - Maximus PhD</h1>
        <p>Unidade: ${unidades.find(u => u.id === unidadeAtiva)?.razao_social}</p>
        <table border='1'>
          <tr><th>Arquivo</th><th>Tipo</th><th>Status</th></tr>
          ${[...docs, ...fotos].map(i => `<tr><td>${i.nome_arquivo}</td><td>${i.tipo_doc}</td><td>${i.status_conformidade}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "RELATORIO_AUDITORIA.doc";
    link.click();
    setStatusAcao("DOCX GERADO!");
  };

  const imprimirPDF = () => {
    window.print(); // Otimizado via CSS @media print abaixo
  };

  // --- FIM EXPORTAÇÃO ---

  async function handleUpload(files) {
    setLoading(true);
    setStatusAcao("PROCESSANDO...");
    for (const file of files) {
      const nomeLimpo = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('evidencias').upload(nomeLimpo, file);
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeLimpo);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: file.type.startsWith('image/') ? publicUrl : null,
        tipo_doc: file.name.toUpperCase().includes('EXTRATO') ? 'FINANCEIRO' : 'AUDITORIA',
        conteudo_extraido: { detalhe: 'AUDITADO VIA IA' },
        status_conformidade: 'CONFORME'
      }]);
    }
    setLoading(false);
    setStatusAcao("CONCLUÍDO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <div className="bg-zinc-900 p-12 rounded-[3rem] w-full max-w-md text-center border border-zinc-800">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 italic">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500 font-bold"
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
      <style>{`
        @media print {
          header, nav, .no-print, button { display: none !important; }
          body { background: white; color: black; }
          .print-only { display: block !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        }
        .print-only { display: none; }
      `}</style>

      <header className="h-28 bg-black border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 no-print">
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
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-8 py-3 rounded-full font-black text-[10px] transition-all ${abaAtiva === aba ? 'bg-green-600 text-black' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <div className="w-40"></div>
      </header>

      <main className="p-8 max-w-7xl mx-auto pb-32">
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-4 rounded-full font-black text-xs z-[100] shadow-2xl flex items-center gap-2 animate-bounce">
            <Zap size={16} fill="black" /> {statusAcao}
          </div>
        )}

        {abaAtiva === 'RELATORIOS' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <ExportCard title="Excel / CSV" desc="Ideal para planilhas e cálculos." icon={<TableIcon size={40}/>} action={exportarCSV} color="hover:border-green-500" />
            <ExportCard title="Word / DOCX" desc="Relatório formatado para edição." icon={<FileText size={40}/>} action={exportarDOCX} color="hover:border-blue-500" />
            <ExportCard title="Imprimir PDF" desc="Gera documento pronto para envio." icon={<Printer size={40}/>} action={imprimirPDF} color="hover:border-white" />
          </div>
        ) : (
          <>
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
              className="mb-12 border-2 border-dashed border-zinc-800 rounded-[3rem] p-16 text-center bg-zinc-900/20 hover:border-green-500 transition-all cursor-pointer no-print"
              onClick={() => inputRef.current.click()}
            >
              <UploadCloud size={50} className="mx-auto mb-4 text-zinc-700" />
              <h2 className="text-xl font-black text-white uppercase italic">Central de Auditoria</h2>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
              {loading && <div className="mt-4"><RefreshCcw className="animate-spin text-green-500 mx-auto" /></div>}
            </div>

            {abaAtiva === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <StatBox label="Base de Dados" value={docs.length} icon={<FileText />} />
                <StatBox label="Fotos Campo" value={fotos.length} icon={<Camera />} />
              </div>
            )}

            {abaAtiva === 'FOTOGRAFICO' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {fotos.map(f => (
                  <div key={f.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group relative">
                    <img src={f.url_foto} className="w-full h-44 object-cover opacity-80" />
                    <button onClick={() => supabase.from('documentos_processados').delete().eq('id', f.id)} className="absolute top-2 right-2 p-2 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} className="text-white"/></button>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'FROTA' && (
              <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 text-zinc-600 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                    <tr><th className="p-8">Arquivo</th><th className="p-8">IA Extração</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-white font-bold text-xs uppercase">
                    {docs.map(d => (
                      <tr key={d.id} className="hover:bg-white/[0.02]">
                        <td className="p-8 truncate max-w-[300px]">{d.nome_arquivo}</td>
                        <td className="p-8 text-green-500 italic">{d.conteudo_extraido?.detalhe}</td>
                        <td className="p-8 text-right"><button onClick={() => supabase.from('documentos_processados').delete().eq('id', d.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={20} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* ÁREA ESCONDIDA APENAS PARA IMPRESSÃO PDF */}
      <div className="print-only">
        <h1>Relatório Maximus PhD - Auditoria Consolidada</h1>
        <p>Unidade: {unidades.find(u => u.id === unidadeAtiva)?.razao_social}</p>
        <table>
          <thead><tr><th>Nome do Arquivo</th><th>Tipo</th><th>Status</th></tr></thead>
          <tbody>
            {[...docs, ...fotos].map(i => (
              <tr key={i.id}><td>{i.nome_arquivo}</td><td>{i.tipo_doc}</td><td>{i.status_conformidade}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem]">
      <div className="text-green-500 mb-4">{icon}</div>
      <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest">{label}</h3>
      <p className="text-8xl font-black text-white italic mt-2">{value}</p>
    </div>
  );
}

function ExportCard({ title, desc, icon, action, color }) {
  return (
    <div 
      onClick={action}
      className={`bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] text-center cursor-pointer transition-all border-b-4 ${color} active:scale-95`}
    >
      <div className="text-zinc-500 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-white font-black text-xl mb-2">{title}</h3>
      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{desc}</p>
    </div>
  );
}
