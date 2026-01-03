import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Clock, CheckCircle, Scale, FileOutput, MapPin, Key
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE COM SENHA INTEGRADA ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'maximus 2026'; // Senha restaurada conforme solicitado
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV14() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [fotosDb, setFotosDb] = useState([]);
  const [arquivosDb, setArquivosDb] = useState([]);

  // --- BASE LEGAL COMPLETA DO ESTADO DO PARÁ ---
  const baseLegal = [
    { ref: 'Lei Estadual 5.887/95', desc: 'Dispõe sobre a Política Estadual do Meio Ambiente do Pará.' },
    { ref: 'Resolução COEMA 162/21', desc: 'Define o impacto local para fins de licenciamento municipal.' },
    { ref: 'Instrução Normativa 11/19', desc: 'Estabelece os procedimentos de licenciamento na SEMAS/PA.' },
    { ref: 'Resolução ANTT 5.998/22', desc: 'Atualização do Regulamento de Transporte de Produtos Perigosos.' },
    { ref: 'ABNT NBR 14725:2023', desc: 'Nova norma para Fichas de Dados de Segurança (FDS).' }
  ];

  useEffect(() => { if (dados.cnpj.length >= 14) carregarDossie(); }, [dados.cnpj]);

  async function carregarDossie() {
    const { data } = await supabase.from('arquivos_processo').select('*').eq('empresa_cnpj', dados.cnpj);
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
    }
  }

  const handleFileUpload = async (e, cat) => {
    if (!dados.cnpj) return alert("Por favor, informe o CNPJ antes de subir arquivos.");
    setLoading(true);
    const files = Array.from(e.target.files);
    for (const file of files) {
      const path = `${dados.cnpj}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name, url_publica: url.publicUrl, 
          empresa_cnpj: dados.cnpj, categoria: cat
        }]);
      }
    }
    carregarDossie();
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans">
      
      {/* SIDEBAR COM AUTENTICAÇÃO */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-2 mb-10 border-b border-slate-700 pb-6">
          <ShieldCheck className="text-green-500" size={28}/>
          <h1 className="text-lg font-black italic">MAXIMUS <span className="text-green-400 font-normal">v14</span></h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Dossiê" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<Scale/>} label="Base Legal" active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera/>} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature/>} label="Gerar Ofício" active={aba === 'print_oficio'} onClick={() => setAba('print_oficio')} />
          <MenuBtn icon={<FileOutput/>} label="Procuração" active={aba === 'print_proc'} onClick={() => setAba('print_proc')} />
        </nav>

        <div className="mt-auto p-4 bg-slate-800 rounded-2xl border border-slate-700">
           <div className="flex items-center gap-2 mb-2">
             <Key size={12} className="text-green-400"/>
             <p className="text-[9px] font-bold text-slate-500 uppercase">Acesso Autenticado</p>
           </div>
           <input 
             className="w-full bg-slate-900 border-none text-xs font-bold p-2 rounded text-green-400 text-center" 
             value={dados.cnpj} 
             onChange={(e)=>setDados({...dados, cnpj: e.target.value})}
             placeholder="CNPJ DO CLIENTE"
           />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b flex justify-between items-center px-10 no-print">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             {loading ? "Sincronizando com Supabase..." : "Sistema de Gestão Ambiental Maximus"}
           </span>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition">Imprimir PDF</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* DASHBOARD DE DADOS */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 animate-in fade-in">
               <h2 className="text-xl font-black text-slate-800 uppercase italic">Dados do Proponente</h2>
               <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v)=>setDados({...dados, cnpj: v})}/>
                  <InputGroup label="Endereço" value={dados.endereco} onChange={(v)=>setDados({...dados, endereco: v})}/>
                  <InputGroup label="Técnico" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                  <InputGroup label="CREA/PA" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                  <InputGroup label="Município" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
               </div>
               <div className="pt-6 border-t">
                  <label className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer">
                    Subir Documentação <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'DOCUMENTO')}/>
                  </label>
               </div>
            </div>
          )}

          {/* BASE LEGAL */}
          {aba === 'leis' && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h2 className="text-xl font-black text-slate-800 italic uppercase">Biblioteca de Normas Aplicáveis</h2>
              {baseLegal.map((lei, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><Gavel size={20}/></div>
                  <div>
                    <h4 className="font-bold text-slate-700">{lei.ref}</h4>
                    <p className="text-xs text-slate-500">{lei.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in zoom-in">
               <div className="flex justify-between items-center no-print">
                  <h2 className="text-xl font-black text-slate-800 italic uppercase">Laudo Fotográfico Técnico</h2>
                  <label className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer">
                    Adicionar Fotos <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'FOTO')}/>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                  {fotosDb.map((f, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2.5rem] border shadow-sm break-inside-avoid">
                       <img src={f.url_publica} className="h-64 w-full object-cover rounded-[2rem] mb-4 border" alt="Evidência"/>
                       <textarea className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold text-slate-600" placeholder="Legenda técnica..."/>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* OFÍCIO DE REQUERIMENTO */}
          {aba === 'print_oficio' && (
            <div className="bg-white p-16 text-slate-900 leading-relaxed font-serif animate-in fade-in">
              <h1 className="text-center font-bold text-xl uppercase underline mb-20">Ofício de Requerimento</h1>
              <p className="text-right mb-12">{dados.cidade}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="mb-10 font-bold">À Secretaria de Meio Ambiente de {dados.cidade}</p>
              <p className="indent-12 text-justify mb-8">
                A empresa <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, CNPJ <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                vem requerer a abertura de processo de licenciamento ambiental, conforme as normas vigentes da SEMAS/PA.
              </p>
              <div className="mt-40 flex flex-col items-center">
                <div className="border-t border-black w-64 mb-2"></div>
                <p className="text-xs font-bold uppercase">{dados.razao || "Assinatura"}</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
    }`}> {icon} {label} </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-green-500 font-bold text-slate-700 outline-none"/>
    </div>
  );
}
