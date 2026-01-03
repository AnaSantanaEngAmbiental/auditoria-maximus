import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Scale, FileOutput, Key, HardDrive, Trash2, Eye
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'maximus 2026'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV16() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém'
  });

  const [fotosDb, setFotosDb] = useState([]);
  const [arquivosDb, setArquivosDb] = useState([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { if (dados.cnpj.length >= 14) carregarDossie(); }, [dados.cnpj]);

  async function carregarDossie() {
    const { data } = await supabase.from('arquivos_processo').select('*').eq('empresa_cnpj', dados.cnpj);
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
    }
  }

  // FUNÇÃO DE UPLOAD MELHORADA
  const realizarUpload = async (files, categoria) => {
    if (!dados.cnpj) return alert("Insira o CNPJ primeiro!");
    setLoading(true);
    
    for (const file of files) {
      const path = `${dados.cnpj}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name, url_publica: url.publicUrl, 
          empresa_cnpj: dados.cnpj, categoria: categoria
        }]);
      }
    }
    carregarDossie();
    setLoading(false);
  };

  // HANDLERS DE DRAG AND DROP
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // Identifica se é foto ou documento pela extensão
    const fotos = files.filter(f => f.type.startsWith('image/'));
    const docs = files.filter(f => !f.type.startsWith('image/'));
    
    if (fotos.length > 0) realizarUpload(fotos, 'FOTO');
    if (docs.length > 0) realizarUpload(docs, 'DOCUMENTO');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
          <div className="bg-green-500 p-2 rounded-xl"><ShieldCheck size={24}/></div>
          <h1 className="text-lg font-black italic tracking-tighter text-white">MAXIMUS <span className="text-green-400">V16</span></h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Dossiê Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud/>} label="Arraste e Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Scale/>} label="Base Legal" active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera/>} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature/>} label="Gerar Ofício" active={aba === 'print_oficio'} onClick={() => setAba('print_oficio')} />
          <MenuBtn icon={<FileOutput/>} label="Procuração" active={aba === 'print_proc'} onClick={() => setAba('print_proc')} />
        </nav>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
           <div className="flex items-center gap-2 mb-2">
             <Key size={12} className="text-green-400"/>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Autenticado</p>
           </div>
           <input className="w-full bg-slate-900 border-none text-[11px] font-bold text-green-500 p-2 rounded-lg outline-none" value={dados.cnpj} onChange={(e)=>setDados({...dados, cnpj: e.target.value})} placeholder="CNPJ DO CLIENTE"/>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
             {loading ? "Processando arquivos..." : "Ambiente de Engenharia Ambiental"}
           </span>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-xl">Imprimir</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* ABA: ARRASTE E COLE (UPLOAD COMPLETO) */}
          {aba === 'upload' && (
            <div className="space-y-8 animate-in fade-in">
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-[3rem] p-20 text-center transition-all duration-300 ${
                  dragging ? 'border-green-500 bg-green-50 scale-95' : 'border-slate-200 bg-white hover:border-blue-400'
                }`}
              >
                <UploadCloud size={80} className={`mx-auto mb-6 ${dragging ? 'text-green-500 animate-bounce' : 'text-slate-200'}`} />
                <h2 className="text-3xl font-black text-slate-800 uppercase italic">Área de Ingestão Maximus</h2>
                <p className="text-slate-400 font-bold text-sm mb-8">Arraste seus PDF's, Documentos e Fotos de inspeção aqui</p>
                <input type="file" multiple className="hidden" id="fileInput" onChange={(e) => realizarUpload(Array.from(e.target.files), 'DOCUMENTO')} />
                <label htmlFor="fileInput" className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase text-xs cursor-pointer hover:bg-green-600 transition">Selecionar do Computador</label>
              </div>

              {/* LISTA DE ARQUIVOS JÁ ENVIADOS */}
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-4">Arquivos no Dossiê</h3>
                {arquivosDb.map((arq, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><FileText size={20}/></div>
                      <span className="text-xs font-bold text-slate-600 truncate max-w-xs">{arq.nome_arquivo}</span>
                    </div>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={18}/></a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA DASHBOARD */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 animate-in fade-in">
               <h2 className="text-2xl font-black text-slate-800 uppercase italic">Dados do Empreendimento</h2>
               <div className="grid grid-cols-2 gap-8">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v)=>setDados({...dados, cnpj: v})}/>
                  <InputGroup label="Endereço" value={dados.endereco} onChange={(v)=>setDados({...dados, endereco: v})}/>
                  <InputGroup label="Técnico" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                  <InputGroup label="Registro Profissional" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                  <InputGroup label="Cidade" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
               </div>
            </div>
          )}

          {/* BASE LEGAL (TEXTO COMPLETO) */}
          {aba === 'leis' && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h2 className="text-2xl font-black text-slate-800 italic uppercase">Base Normativa Pará/Brasil</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { ref: 'Lei Est. 5.887/95', desc: 'Política Estadual de Meio Ambiente do Pará.' },
                  { ref: 'Res. COEMA 162/21', desc: 'Competência Municipal no licenciamento.' },
                  { ref: 'ANTT 5.998/22', desc: 'Transporte de Produtos Perigosos.' },
                  { ref: 'NBR 14725:2023', desc: 'Norma Técnica para FDS/FISPQ.' }
                ].map((lei, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400"><Scale size={20}/></div>
                    <div><h4 className="text-sm font-black text-slate-700">{lei.ref}</h4><p className="text-xs text-slate-500 font-bold">{lei.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in zoom-in">
               <h2 className="text-2xl font-black text-slate-800 italic uppercase">Laudo Fotográfico Técnico</h2>
               <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                  {fotosDb.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-[3rem] border shadow-sm break-inside-avoid">
                       <img src={f.url_publica} className="h-64 w-full object-cover rounded-[2.5rem] mb-4 border" alt="Inspeção"/>
                       <textarea className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold text-slate-600 h-24 shadow-inner" placeholder="Descreva a evidência..."/>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// UI HELPERS
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}> {React.cloneElement(icon, { size: 18 })} {label} </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[1.5rem] focus:border-green-500 font-bold text-slate-700 outline-none transition-all shadow-inner focus:bg-white"/>
    </div>
  );
}
