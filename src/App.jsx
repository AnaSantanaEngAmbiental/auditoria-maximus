import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Clock, CheckCircle, Scale, FileOutput, MapPin, HardDrive, Key
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE INTEGRADA ---
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

  // --- BASE LEGAL COMPLETA E EXAUSTIVA (PARÁ/BRASIL) ---
  const baseLegalCompilada = [
    { ref: 'Lei Est. 5.887/95', desc: 'Política Estadual de Meio Ambiente do Pará.', contexto: 'Estruturante' },
    { ref: 'Res. COEMA 162/21', desc: 'Define competência Municipal no licenciamento no Pará.', contexto: 'Jurisdição' },
    { ref: 'Inst. Norm. 11/19 SEMAS', desc: 'Roteiro de licenciamento e prazos de renovação (120 dias).', contexto: 'Procedimental' },
    { ref: 'Res. ANTT 5.998/22', desc: 'Regulamento para Transporte de Produtos Perigosos.', contexto: 'Logística' },
    { ref: 'ABNT NBR 14725:2023', desc: 'Classificação e Rotulagem GHS (Substitui FISPQ).', contexto: 'Segurança' },
    { ref: 'ABNT NBR 15481:2023', desc: 'Requisitos para transporte de produtos perigosos.', contexto: 'Operacional' },
    { ref: 'Lei Federal 12.305/10', desc: 'Plano de Gerenciamento de Resíduos Sólidos (PGRS).', contexto: 'Resíduos' },
    { ref: 'Dec. Fed. 6.514/08', desc: 'Infrações e Sanções Administrativas Ambientais.', contexto: 'Penal' }
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
    if (!dados.cnpj) return alert("Por favor, identifique o CNPJ do cliente primeiro.");
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
          <div className="bg-green-500 p-2 rounded-xl"><ShieldCheck size={24}/></div>
          <h1 className="text-lg font-black italic">MAXIMUS <span className="text-green-400">V14</span></h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Cadastro Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud/>} label="Upload de Provas" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Scale/>} label="Biblioteca Legal" active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera/>} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature/>} label="Gerar Ofício" active={aba === 'print_oficio'} onClick={() => setAba('print_oficio')} />
          <MenuBtn icon={<FileOutput/>} label="Procuração" active={aba === 'print_proc'} onClick={() => setAba('print_proc')} />
        </nav>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-inner">
           <div className="flex items-center gap-2 mb-2">
             <Key size={12} className="text-green-400"/>
             <p className="text-[10px] font-black text-slate-400 uppercase">Sistema Autenticado</p>
           </div>
           <input className="w-full bg-transparent border-none text-[11px] font-bold text-green-500 outline-none" value={dados.cnpj} onChange={(e)=>setDados({...dados, cnpj: e.target.value})} placeholder="00.000.000/0000-00"/>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></div>
             {loading ? 'Processando Inteligência de Dados...' : `Ativo: ${dados.razao || "Maximus Enterprise"}`}
           </span>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-lg">Imprimir Documentação</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* ABA: BASE LEGAL COMPLETA */}
          {aba === 'leis' && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-slate-800 italic uppercase flex items-center gap-3"><Gavel className="text-blue-500"/> Fundamentação Técnica e Jurídica</h2>
              <div className="grid grid-cols-1 gap-3">
                {baseLegalCompilada.map((lei, i) => (
                  <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:text-blue-500 transition"><Scale size={20}/></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-700">{lei.ref}</h4>
                        <p className="text-[11px] text-slate-500 font-bold">{lei.desc}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-4 py-1.5 rounded-full uppercase">{lei.contexto}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: RELATÓRIO FOTOGRÁFICO PROFISSIONAL */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in zoom-in duration-300">
               <div className="flex justify-between items-end no-print">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 italic uppercase">Laudo Fotográfico de Campo</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">Conforme orientações da SEMAS-PA e normas ABNT</p>
                  </div>
                  <label className="bg-blue-600 text-white px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer hover:bg-blue-700 shadow-xl transition-all">
                    Importar Evidências <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'FOTO')}/>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                  {fotosDb.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-[3rem] border shadow-sm break-inside-avoid ring-1 ring-slate-100">
                       <img src={f.url_publica} className="h-72 w-full object-cover rounded-[2.5rem] mb-5 border border-slate-100" alt="Evidência Ambiental"/>
                       <div className="px-2">
                          <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest italic">Evidência #{i+1}</p>
                          <textarea className="w-full bg-slate-50 border-none p-5 rounded-2xl text-[11px] font-bold text-slate-600 h-28 focus:ring-2 ring-green-500" placeholder="Descreva tecnicamente esta evidência..."/>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* ABA DASHBOARD */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12 animate-in fade-in">
               <div className="flex items-center gap-4 border-b pb-8">
                  <div className="bg-blue-50 p-4 rounded-3xl text-blue-600"><Building2 size={32}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase italic">Dossiê do Proponente</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Controle Central de Informações do Licenciamento</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v)=>setDados({...dados, cnpj: v})}/>
                  <InputGroup label="Endereço Completo" value={dados.endereco} onChange={(v)=>setDados({...dados, endereco: v})}/>
                  <InputGroup label="Técnico Responsável" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                  <InputGroup label="Registro Profissional (CREA/CFT)" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                  <InputGroup label="Local do Licenciamento" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
               </div>
            </div>
          )}

          {/* DOCUMENTOS PARA IMPRESSÃO INTEGRADOS */}
          <div className="print:block">
            {aba === 'print_oficio' && (
              <div className="bg-white p-20 leading-relaxed text-slate-900 animate-in slide-in-from-bottom-10">
                <h1 className="text-center font-bold text-2xl uppercase underline mb-24">Ofício de Requerimento de Licenciamento</h1>
                <p className="text-right mb-16 font-bold">{dados.cidade}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="mb-12 font-black">Excelentíssimo Secretário de Meio Ambiente,</p>
                <p className="indent-12 text-justify mb-10 text-lg">
                  O requerente <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, devidamente inscrito no CNPJ sob o nº <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                  situado em {dados.endereco || "[ENDEREÇO]"}, vem respeitosamente requerer a concessão de 
                  <strong> LICENÇA AMBIENTAL</strong> para suas atividades operacionais, conforme documentação técnica anexa e em conformidade 
                  com a legislação vigente no Estado do Pará.
                </p>
                <p className="indent-12 text-justify mb-10 text-lg">Nestes termos, pede e aguarda deferimento.</p>
                <div className="mt-52 flex flex-col items-center">
                  <div className="border-t-2 border-slate-900 w-80 mb-3"></div>
                  <p className="font-black text-sm uppercase">{dados.razao || "Assinatura do Representante Legal"}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// UI COMPONENT HELPERS
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase tracking-tight ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-2' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
    }`}> {React.cloneElement(icon, { size: 18 })} {label} </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest group-focus-within:text-green-500 transition-colors">{label}</label>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-slate-100 border-2 border-transparent p-5 rounded-[1.5rem] focus:border-green-500 font-bold text-slate-700 outline-none transition-all focus:bg-white shadow-inner"
      />
    </div>
  );
}
