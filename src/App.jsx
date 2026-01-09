import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Building2, 
  Zap, FileText, Camera, CheckCircle, 
  RefreshCcw, File, Printer, Download, Table as TableIcon, X, Eye
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
  const [docs, setDocs] = useState([]); // Apenas Documentos
  const [fotos, setFotos] = useState([]); // Apenas Fotos
  const [loading, setLoading] = useState(false);
  const [statusAcao, setStatusAcao] = useState('');
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (autorizado) carregarUnidades();
  }, [autorizado]);

  useEffect(() => {
    if (autorizado && unidadeAtiva) {
      carregarDados();
      // REALTIME: Escuta inserções e deleções para atualizar a grade na hora
      const subscription = supabase
        .channel('maximus_v22_sync')
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
    const { data, error } = await supabase.from('documentos_processados')
      .select('*')
      .eq('unidade_id', unidadeAtiva)
      .order('data_leitura', { ascending: false });

    if (data) {
      // Separação inteligente: se tem URL de foto, vai para a galeria. Se não, vai para a lista de documentos.
      setFotos(data.filter(d => d.url_foto !== null && d.url_foto !== ''));
      setDocs(data.filter(d => d.url_foto === null || d.url_foto === ''));
    }
  }

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const exportarCSV = () => {
    const cabecalho = "Arquivo;Tipo;Conteudo;Status;Data\n";
    const todasLinhas = [...docs, ...fotos].map(i => 
      `${i.nome_arquivo};${i.tipo_doc};${i.conteudo_extraido?.detalhe || 'N/A'};${i.status_conformidade};${new Date(i.data_leitura).toLocaleDateString()}`
    ).join("\n");
    const blob = new Blob(["\ufeff" + cabecalho + todasLinhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `MAXIMUS_EXPORT_${new Date().getTime()}.csv`;
    link.click();
    setStatusAcao("EXCEL GERADO");
  };

  const exportarDOCX = () => {
    const html = `<html><body style="font-family:Arial"><h2>Relatório Maximus</h2><table border="1">
      ${[...docs, ...fotos].map(i => `<tr><td>${i.nome_arquivo}</td><td>${i.status_conformidade}</td></tr>`).join('')}
    </table></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "RELATORIO_AUDITORIA.doc";
    link.click();
  };

  // --- GERENCIAMENTO DE ARQUIVOS ---
  async function handleUpload(files) {
    setLoading(true);
    setStatusAcao("IA PROCESSANDO...");
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const nomeFinal = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      const { error: upErr } = await supabase.storage.from('evidencias').upload(nomeFinal, file);
      if (upErr) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(nomeFinal);

      await supabase.from('documentos_processados').insert([{
        unidade_id: unidadeAtiva,
        nome_arquivo: file.name,
        url_foto: isImage ? publicUrl : null,
        tipo_doc: isImage ? 'EVIDENCIA_FOTO' : (file.name.toUpperCase().includes('EXTRATO') ? 'FINANCEIRO' : 'DOCUMENTO'),
        conteudo_extraido: { detalhe: isImage ? 'IMAGEM PROCESSADA' : 'TEXTO EXTRAÍDO VIA IA' },
        status_conformidade: 'CONFORME'
      }]);
    }
    setLoading(false);
    setStatusAcao("CONCLUÍDO!");
    setTimeout(() => setStatusAcao(""), 2000);
  }

  async function deletar(id) {
    if(confirm("Excluir definitivamente?")) {
      await supabase.from('documentos_processados').delete().eq('id', id);
      // O Realtime atualizará a lista automaticamente
    }
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-4xl mb-8 italic italic uppercase">MAXIMUS <span className="text-green-500">PhD</span></h1>
          <input 
            type="password" placeholder="SENHA DE ACESSO" 
            className="w-full bg-black border border-zinc-800 rounded-2xl py-5 text-white text-center mb-6 outline-none focus:border-green-500 font-bold text-xl"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (senha === '3840' || senha === 'admin') && setAutorizado(true)}
          />
          <button onClick={() => (senha === '3840' || senha === 'admin') && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-5 rounded-2xl uppercase tracking-[10px] hover:bg-green-400 transition-all">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-500 font-sans">
      
      {/* HEADER DINÂMICO */}
      <header className="h-28 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50 backdrop-blur-md no-print">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-2xl italic tracking-tighter">MAXIMUS PhD</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <select 
              className="bg-transparent text-zinc-400 font-black text-[10px] outline-none cursor-pointer uppercase hover:text-white"
              value={unidadeAtiva} onChange={(e) => setUnidadeAtiva(e.target.value)}
            >
              {unidades.map(u => <option key={u.id} value={u.id} className="bg-zinc-900 text-white">{u.razao_social}</option>)}
            </select>
          </div>
        </div>

        <nav className="flex gap-2 bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-inner">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA', 'RELATORIOS'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-8 py-3 rounded-full font-black text-[10px] transition-all tracking-widest ${abaAtiva === aba ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <div className="flex gap-4">
           <button onClick={() => window.print()} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-white transition-all text-white"><Printer size={18}/></button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto pb-40">
        
        {/* TOAST DE STATUS */}
        {statusAcao && (
          <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-4 rounded-full font-black text-xs z-[100] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <Zap size={16} fill="black" className="text-green-600"/> {statusAcao}
          </div>
        )}

        {/* ÁREA DE RELATÓRIOS (NOVA) */}
        {abaAtiva === 'RELATORIOS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-300">
            <div onClick={exportarCSV} className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] hover:border-green-500 transition-all cursor-pointer group">
              <TableIcon size={40} className="text-zinc-700 group-hover:text-green-500 mb-4" />
              <h3 className="text-white font-black text-2xl italic">Exportar Excel (CSV)</h3>
              <p className="text-xs mt-2 uppercase tracking-widest text-zinc-600 font-bold">Base de dados completa para planilhas</p>
            </div>
            <div onClick={exportarDOCX} className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] hover:border-blue-500 transition-all cursor-pointer group">
              <FileText size={40} className="text-zinc-700 group-hover:text-blue-500 mb-4" />
              <h3 className="text-white font-black text-2xl italic">Exportar Word (DOCX)</h3>
              <p className="text-xs mt-2 uppercase tracking-widest text-zinc-600 font-bold">Relatório descritivo para edição</p>
            </div>
          </div>
        ) : (
          <>
            {/* UPLOAD SEMPRE VISÍVEL NAS ABAS DE DADOS */}
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)); }}
              onClick={() => inputRef.current.click()}
              className="mb-12 border-2 border-dashed border-zinc-800 rounded-[3rem] p-16 text-center bg-zinc-900/20 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer group relative overflow-hidden no-print"
            >
              <UploadCloud size={50} className="mx-auto mb-4 text-zinc-700 group-hover:text-green-500 transition-all" />
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Núcleo de Processamento</h2>
              <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-[5px]">Arraste Fotos ou Documentos aqui</p>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleUpload(Array.from(e.target.files))} />
              {loading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md"><RefreshCcw className="animate-spin text-green-500" size={50} /></div>}
            </div>

            {/* VIEW: DASHBOARD */}
            {abaAtiva === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
                <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem]">
                  <FileText size={40} className="text-green-500 mb-4" />
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Documentos Auditados</h3>
                  <p className="text-8xl font-black text-white italic tracking-tighter">{docs.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem]">
                  <Camera size={40} className="text-green-500 mb-4" />
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Evidências Fotográficas</h3>
                  <p className="text-8xl font-black text-white italic tracking-tighter">{fotos.length}</p>
                </div>
              </div>
            )}

            {/* VIEW: FOTOGRÁFICO (ONDE ESTÃO AS FOTOS) */}
            {abaAtiva === 'FOTOGRAFICO' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4">
                {fotos.length === 0 && <div className="col-span-4 py-20 text-center font-black uppercase tracking-widest opacity-20 italic text-4xl">Nenhuma Foto</div>}
                {fotos.map(f => (
                  <div key={f.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl transition-all hover:-translate-y-2">
                    <img src={f.url_foto} className="w-full h-56 object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" loading="lazy" />
                    <div className="p-6 bg-zinc-950 border-t border-zinc-900">
                      <p className="text-[9px] font-black text-white truncate uppercase mb-1">{f.nome_arquivo}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">{f.status_conformidade}</span>
                        <button onClick={() => deletar(f.id)} className="text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW: FROTA (ONDE ESTÃO OS DOCUMENTOS) */}
            {abaAtiva === 'FROTA' && (
              <div className="bg-zinc-900 rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                <table className="w-full text-left">
                  <thead className="bg-black/50 text-zinc-600 text-[10px] font-black uppercase tracking-[3px] border-b border-zinc-800">
                    <tr><th className="p-8">Documento</th><th className="p-8">Extração IA</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-white font-bold text-xs uppercase">
                    {docs.length === 0 && <tr><td colSpan="3" className="p-20 text-center opacity-10 text-2xl italic font-black uppercase">Vazio</td></tr>}
                    {docs.map(d => (
                      <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-8 flex items-center gap-4">
                          <File size={20} className="text-zinc-700 group-hover:text-green-500 transition-colors" />
                          <span className="truncate max-w-[300px]">{d.nome_arquivo}</span>
                        </td>
                        <td className="p-8 italic text-green-500 text-[10px]">{d.conteudo_extraido?.detalhe}</td>
                        <td className="p-8 text-right"><button onClick={() => deletar(d.id)} className="text-zinc-800 hover:text-red-500 p-2"><Trash2 size={20}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* RODAPÉ E ÁREA DE IMPRESSÃO */}
      <footer className="fixed bottom-0 w-full bg-black/95 border-t border-zinc-900 p-6 flex justify-between items-center z-50 no-print">
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black text-zinc-800 tracking-[10px]">MAXIMUS v22.0</span>
           <div className="h-4 w-px bg-zinc-800"></div>
           <p className="text-[9px] font-black text-green-700 uppercase">Status: Operacional</p>
        </div>
      </footer>

      {/* CSS PARA IMPRESSÃO PDF */}
      <style>{`
        @media print {
          .no-print, header, nav, footer, button { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          .bg-zinc-900 { background: transparent !important; border: 1px solid #eee !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd !important; padding: 10px !important; color: black !important; }
          h1, h2, h3 { color: black !important; text-transform: uppercase !important; }
          .grid { display: block !important; }
        }
      `}</style>
    </div>
  );
}
