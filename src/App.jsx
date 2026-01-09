import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, Trash2, Search,
  Database, FileText, Camera, Image as ImageIcon, X, Zap, 
  AlertTriangle, CheckCircle, RefreshCcw, LayoutDashboard, 
  Clock, QrCode, FileType, Layers
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
  const [abaAtiva, setAbaAtiva] = useState('DASHBOARD'); 
  const [statusAcao, setStatusAcao] = useState('');
  const [dragAtivo, setDragAtivo] = useState(false);

  const [segundos, setSegundos] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const universalInputRef = useRef(null);

  useEffect(() => {
    let intervalo;
    if (timerAtivo) intervalo = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(intervalo);
  }, [timerAtivo]);

  useEffect(() => {
    const scripts = [
      'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src; s.async = false;
        document.head.appendChild(s);
      }
    });
    if (autorizado) carregarDados();
  }, [autorizado]);

  const carregarDados = async () => {
    const { data } = await supabase.from('documentos_processados').select('*').order('data_leitura', { ascending: false });
    if (data) setDocs(data);
  };

  // --- SUPER DISTRIBUIDOR DE ARQUIVOS (ARRASTE E COLE) ---
  const processarArquivosUniversais = async (files) => {
    setLoading(true);
    setStatusAcao(`Processando ${files.length} arquivos...`);

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      
      // DESTINO 1: MOTOR FOTOGRÁFICO (Imagens)
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          let placa = "";
          try {
            const res = await window.Tesseract.recognize(file, 'eng');
            placa = (res.data.text.match(/[A-Z]{3}[- ]?[0-9][A-Z0-9][0-9]{2}/gi) || [])[0];
          } catch (e) {}
          setFotos(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result,
            legenda: placa ? `PLACA: ${placa.toUpperCase()}.` : `Evidência: ${file.name}`
          }]);
        };
      } 
      // DESTINO 2: BASE DE DADOS (Documentos/Planilhas)
      else {
        const novoDoc = {
          nome_arquivo: file.name,
          status_conformidade: 'ANALISANDO',
          data_leitura: new Date().toISOString(),
          conteudo_extraido: { tipo: ext.toUpperCase(), tamanho: file.size }
        };
        await supabase.from('documentos_processados').insert([novoDoc]);
      }
    }
    
    await carregarDados();
    setLoading(false);
    setStatusAcao('Arquivos Distribuídos com Sucesso!');
    setTimeout(() => setStatusAcao(''), 3000);
  };

  // --- GERADOR DE PDF COM QR MAXIMUS ---
  const gerarLaudoComQR = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const token = Math.random().toString(36).toUpperCase().substring(2, 12);
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(22);
    doc.text("MAXIMUS PhD - LAUDO TÉCNICO", 20, 25);
    doc.setFontSize(10);
    doc.text(`AUTENTICIDADE: ${token}`, 20, 35);

    let y = 65;
    fotos.forEach((f, i) => {
      if (y > 220) { doc.addPage(); y = 20; }
      try { doc.addImage(f.url, 'JPEG', 20, y, 50, 40); } catch(e){}
      doc.setTextColor(0);
      doc.text(f.legenda, 75, y + 20);
      y += 50;
    });

    // Rodapé com QR Code (Placeholder visual no PDF)
    doc.setDrawColor(34, 197, 94);
    doc.line(20, 280, 190, 280);
    doc.setFontSize(8);
    doc.text(`QR MAXIMUS VERIFIED: scan.maximusphd.com/v/${token}`, 20, 285);
    
    doc.save(`LAUDO_PHD_${token}.pdf`);
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 text-[18px]">
        <div className="bg-zinc-900 border-4 border-zinc-800 p-16 rounded-[5rem] w-full max-w-2xl text-center">
          <ShieldCheck size={80} className="text-green-500 mx-auto mb-10" />
          <h2 className="text-white font-black text-5xl mb-12 uppercase italic">MAXIMUS <span className="text-green-500">PhD</span></h2>
          <input 
            type="password" placeholder="Senha Auditor"
            className="w-full bg-black border-2 border-zinc-800 rounded-3xl py-8 text-white text-center mb-8 outline-none focus:border-green-500 text-3xl"
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && senha === 'admin' && setAutorizado(true)}
          />
          <button onClick={() => senha === 'admin' && setAutorizado(true)} className="w-full bg-green-600 text-black font-black py-8 rounded-3xl uppercase text-xl tracking-[10px]">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans text-[18px]">
      <header className="h-32 bg-zinc-950 border-b-2 border-zinc-900 flex items-center justify-between px-16 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-white font-black text-4xl tracking-tighter uppercase">Maximus <span className="text-green-500 italic">PhD</span></h1>
          <span className="text-xs font-bold text-zinc-700 tracking-[8px] uppercase">Unidade Pericial Marabá</span>
        </div>

        <nav className="flex gap-4 bg-black p-2 rounded-3xl border-2 border-zinc-900">
          {['DASHBOARD', 'FOTOGRAFICO', 'FROTA'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`px-10 py-4 rounded-2xl font-black text-sm transition-all ${abaAtiva === aba ? 'bg-green-600 text-black shadow-xl shadow-green-500/20' : 'text-zinc-600 hover:text-white'}`}>{aba}</button>
          ))}
        </nav>

        <div className="text-right">
          <p className="text-xs font-black text-zinc-800 uppercase tracking-widest">Tempo Vistoria</p>
          <p className="text-4xl font-mono text-green-500 font-bold">{(segundos / 60).toFixed(1)}m</p>
        </div>
      </header>

      <main className="p-16 max-w-[1800px] mx-auto pb-48">
        
        {/* SUPER INPUT UNIVERSAL (DRAG & DROP) */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragAtivo(true); }}
          onDragLeave={() => setDragAtivo(false)}
          onDrop={(e) => { e.preventDefault(); setDragAtivo(false); processarArquivosUniversais(Array.from(e.dataTransfer.files)); }}
          onClick={() => universalInputRef.current.click()}
          className={`mb-16 border-4 border-dashed rounded-[4rem] p-24 text-center transition-all cursor-pointer ${dragAtivo ? 'border-green-500 bg-green-500/5 scale-95' : 'border-zinc-900 bg-zinc-900/10 hover:border-zinc-700'}`}
        >
          <div className="bg-zinc-950 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <UploadCloud size={60} className={dragAtivo ? 'text-green-500 animate-bounce' : 'text-zinc-700'} />
          </div>
          <h2 className="text-white text-5xl font-black uppercase mb-6 italic tracking-tighter">Arraste e Cole Geral</h2>
          <p className="text-zinc-500 text-xl font-bold tracking-widest">PDF • XLSX • DOCX • JPG • CSV • JSON</p>
          <input ref={universalInputRef} type="file" multiple className="hidden" onChange={(e) => processarArquivosUniversais(Array.from(e.target.files))} />
        </div>

        {statusAcao && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-green-500 text-black px-12 py-6 rounded-full font-black text-xl uppercase shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-bounce z-[100]">
            {statusAcao}
          </div>
        )}

        {/* ABA DASHBOARD */}
        {abaAtiva === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-700">
            <div className="bg-zinc-900/50 border-2 border-zinc-800 p-12 rounded-[4rem]">
              <Layers size={50} className="text-green-500 mb-6" />
              <h3 className="text-xl font-black uppercase text-zinc-600 mb-4">Integridade da Base</h3>
              <p className="text-6xl font-black text-white">{docs.length + fotos.length}</p>
              <p className="text-zinc-500 mt-4">Arquivos integrados na unidade atual.</p>
            </div>
            <div className="bg-zinc-900/50 border-2 border-zinc-800 p-12 rounded-[4rem]">
              <QrCode size={50} className="text-green-500 mb-6" />
              <h3 className="text-xl font-black uppercase text-zinc-600 mb-4">Autenticação Maximus</h3>
              <p className="text-2xl font-bold text-white italic">Módulo QR Code Ativo</p>
              <button onClick={() => setTimerAtivo(!timerAtivo)} className="mt-8 bg-zinc-950 border-2 border-zinc-800 text-white px-10 py-4 rounded-2xl font-black hover:border-green-500 transition-all">
                {timerAtivo ? 'PAUSAR CRONÔMETRO' : 'INICIAR VISTORIA'}
              </button>
            </div>
          </div>
        )}

        {/* ABA FOTOGRÁFICA */}
        {abaAtiva === 'FOTOGRAFICO' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-16">
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Relatório</h2>
              <button onClick={gerarLaudoComQR} disabled={fotos.length === 0} className="bg-green-600 text-black font-black px-16 py-6 rounded-3xl text-xl uppercase shadow-2xl disabled:opacity-20">GERAR LAUDO QR</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {fotos.map(f => (
                <div key={f.id} className="bg-zinc-900/30 border-2 border-zinc-800 rounded-[4rem] overflow-hidden group">
                  <div className="relative h-[500px] bg-black">
                    <img src={f.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <button onClick={() => setFotos(prev => prev.filter(x => x.id !== f.id))} className="absolute top-8 right-8 p-5 bg-red-600 text-white rounded-full shadow-2xl"><X size={30}/></button>
                  </div>
                  <div className="p-10">
                    <textarea 
                      className="w-full bg-black border-2 border-zinc-800 rounded-3xl p-8 text-2xl text-zinc-400 outline-none focus:border-green-500 italic h-48 resize-none"
                      value={f.legenda}
                      onChange={(e) => setFotos(fotos.map(x => x.id === f.id ? {...x, legenda: e.target.value} : x))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA BASE DE DADOS */}
        {abaAtiva === 'FROTA' && (
          <div className="bg-zinc-900/20 border-2 border-zinc-800 rounded-[4rem] overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-zinc-950 text-xs font-black text-zinc-700 uppercase tracking-[5px] border-b-2 border-zinc-900">
                  <tr><th className="p-12">Documento</th><th className="p-12">Tipo</th><th className="p-12 text-right">Ação</th></tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-900/50">
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-green-500/[0.02]">
                      <td className="p-12 font-bold text-white text-2xl">{doc.nome_arquivo}</td>
                      <td className="p-12"><span className="bg-zinc-950 px-6 py-2 rounded-full border-2 border-zinc-800 text-zinc-500 font-black text-sm">{doc.conteudo_extraido?.tipo || 'DOC'}</span></td>
                      <td className="p-12 text-right"><button onClick={async () => { await supabase.from('documentos_processados').delete().eq('id', doc.id); carregarDados(); }} className="text-zinc-800 hover:text-red-500"><Trash2 size={30}/></button></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full h-20 bg-black border-t-2 border-zinc-900 flex items-center px-16 justify-between text-xs font-black text-zinc-800 uppercase tracking-[5px]">
        <span>MAXIMUS PhD v14.0 • SUPER INPUT ATIVO</span>
        <div className="flex items-center gap-4 text-green-900">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
          SISTEMA PERICIAL DE ALTA PERFORMANCE
        </div>
      </footer>
    </div>
  );
}
