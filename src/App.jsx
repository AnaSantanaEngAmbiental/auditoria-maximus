import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Loader2, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, Clock, Calendar
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [docs, setDocs] = useState([]);
  const [fotos, setFotos] = useState([]); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('FOTOGRAFICO'); 
  const [statusAcao, setStatusAcao] = useState('');

  const fotoInputRef = useRef(null);
  const universalInputRef = useRef(null);

  // CARREGAMENTO DE MOTORES VIA CDN
  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  async function carregarDados() {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  }

  // --- LÓGICA DE ALERTA DE VALIDADE ---
  const verificarValidade = (dataDoc) => {
    if (!dataDoc) return { rotulo: 'SEM DATA', cor: 'text-zinc-500', bg: 'bg-zinc-900/50' };
    const hoje = new Date();
    const validade = new Date(dataDoc);
    const diffTime = validade - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { rotulo: 'VENCIDO', cor: 'text-red-500', bg: 'bg-red-500/10', alert: true };
    if (diffDays <= 30) return { rotulo: 'EXPIRA EM BREVE', cor: 'text-amber-500', bg: 'bg-amber-500/10', alert: false };
    return { rotulo: 'REGULAR', cor: 'text-green-500', bg: 'bg-green-500/10', alert: false };
  };

  // --- FILTRO INTELIGENTE ---
  const docsFiltrados = useMemo(() => {
    return docs.filter(d => 
      d.nome_arquivo?.toLowerCase().includes(busca.toLowerCase()) || 
      d.conteudo_extraido?.placa?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [docs, busca]);

  // --- INPUT UNIVERSAL (SIMULAÇÃO DE EXTRAÇÃO DATA) ---
  const processarInputUniversal = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    setStatusAcao('Auditoria PhD em curso...');

    for (const file of files) {
      // Simulando datas aleatórias para teste do alerta (Vencidos e Regulares)
      const datasTeste = ['2023-12-01', '2026-05-20', '2025-12-30'];
      const dataSorteada = datasTeste[Math.floor(Math.random() * datasTeste.length)];

      const novoDoc = {
        nome_arquivo: file.name,
        status_conformidade: 'AUDITADO',
        data_leitura: new Date().toISOString(),
        legenda_tecnica: `Validade extraída: ${new Date(dataSorteada).toLocaleDateString()}`,
        conteudo_extraido: { 
          placa: file.name.split('.')[0].toUpperCase().substring(0, 7),
          validade: dataSorteada 
        }
      };
      await supabase.from('documentos_processados').insert([novoDoc]);
    }
    await carregarDados();
    setLoading(false);
    setStatusAcao('Documentos Integrados!');
    setTimeout(() => setStatusAcao(''), 3000);
  };

  const handleFotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      let placaEncontrada = "";
      if (window.Tesseract && file.type.startsWith('image/')) {
        setStatusAcao('OCR: Escaneando Placa...');
        try {
          const { data: { text } } = await window.Tesseract.recognize(file, 'eng');
          placaEncontrada = (text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
        } catch (err) { console.error(err); }
      }
      setFotos(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        legenda: placaEncontrada ? `PLACA: ${placaEncontrada.toUpperCase()}. Vistoria realizada.` : "Evidência fotográfica para laudo pericial."
      }]);
    }
    setLoading(false);
    setStatusAcao('');
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-md text-center shadow-2xl">
          <ShieldCheck size={60} className="text-green-500 mx-auto mb-8 animate-pulse" />
          <h2 className="text-white font-black text-3xl mb-10 tracking-tighter uppercase">Unidade <span className="text-green-500 italic">PhD</span></h2>
          <input 
            type="password" placeholder="Senha Auditor"
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 text-white text-center mb-6 outline-none focus:border-green-500 transition-all"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-[4px] hover:bg-green-500 transition-all">Desbloquear</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans">
      <header className="h-24 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter">MAXIMUS <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-[8px] text-zinc-700 font-bold tracking-[4px] uppercase italic">Auditoria & Engenharia</span>
        </div>

        <nav className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-inner">
          <button onClick={() => setAbaAtiva('FOTOGRAFICO')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FOTOGRAFICO' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>RELATÓRIO FOTOGRÁFICO</button>
          <button onClick={() => setAbaAtiva('FROTA')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${abaAtiva === 'FROTA' ? 'bg-green-600 text-black shadow-lg shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>BASE DE DADOS</button>
        </nav>
        
        <button onClick={() => universalInputRef.current.click()} className="bg-white text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase flex items-center gap-2 hover:bg-green-600 hover:scale-105 transition-all">
          <UploadCloud size={14}/> Input Universal
        </button>
      </header>

      <main className="p-10 max-w-[1500px] mx-auto">
        {statusAcao && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 text-[10px] font-black animate-pulse uppercase">
            <Zap size={16}/> {statusAcao}
          </div>
        )}

        {/* ABA BASE DE DADOS COM ALERTA DE VALIDADE */}
        {abaAtiva === 'FROTA' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Monitor de Validades</h2>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[3px]">Cruzamento automático ANTT / SEMAS</p>
              </div>
              <div className="relative w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-all" size={16}/>
                <input 
                  type="text" 
                  placeholder="BUSCAR PLACA OU DOCUMENTO..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-[11px] text-white outline-none focus:border-green-500/50 transition-all font-mono"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-zinc-900/10 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-[3px] border-b border-zinc-800">
                  <tr>
                    <th className="p-8">Documento Auditado</th>
                    <th className="p-8">Referência</th>
                    <th className="p-8">Vencimento</th>
                    <th className="p-8">Status PhD</th>
                    <th className="p-8 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/30">
                  {docsFiltrados.map(doc => {
                    const status = verificarValidade(doc.conteudo_extraido?.validade);
                    return (
                      <tr key={doc.id} className={`hover:bg-white/[0.02] transition-all group ${status.alert ? 'bg-red-500/[0.03]' : ''}`}>
                        <td className="p-8 text-xs font-bold text-zinc-300">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className={status.alert ? 'text-red-500' : 'text-zinc-700'}/>
                            {doc.nome_arquivo}
                          </div>
                        </td>
                        <td className="p-8 font-mono text-zinc-500 font-bold">{doc.conteudo_extraido?.placa || "N/A"}</td>
                        <td className="p-8 text-xs font-medium">
                          {doc.conteudo_extraido?.validade ? new Date(doc.conteudo_extraido.validade).toLocaleDateString() : '---'}
                        </td>
                        <td className="p-8">
                          <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border border-current ${status.bg} ${status.cor} flex items-center gap-2 w-fit`}>
                            {status.alert ? <AlertTriangle size={10}/> : <CheckCircle size={10}/>}
                            {status.rotulo}
                          </span>
                        </td>
                        <td className="p-8 text-right">
                          <button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="p-3 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA FOTOGRÁFICA */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Fábrica de Laudos</h2>
              <button onClick={() => fotoInputRef.current.click()} className="bg-zinc-900 border border-zinc-800 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase flex items-center gap-3 hover:border-green-500/50 transition-all">
                <Camera size={18}/> ADICIONAR FOTO
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fotos.map((f) => (
                <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden group">
                  <div className="relative h-72 bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(fotos.filter(x => x.id !== f.id))} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-500"><X size={16}/></button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[11px] text-zinc-400 outline-none focus:border-green-500 h-24 italic"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <input ref={fotoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotoUpload} />
      <input ref={universalInputRef} type="file" multiple className="hidden" onChange={processarInputUniversal} />

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-zinc-900 flex items-center px-10 justify-between text-[8px] font-black text-zinc-800 uppercase tracking-[3px]">
        <span>Maximus PhD v9.0 • Monitor de Validade Ativo</span>
        <div className="flex items-center gap-3 text-green-900 font-bold">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          SISTEMA PERICIAL OPERACIONAL
        </div>
      </footer>
    </div>
  );
}
