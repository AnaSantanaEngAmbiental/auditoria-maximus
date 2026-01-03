import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Clock, CheckCircle, Scale, FileOutput, MapPin, Key, HardDrive
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE DEFINITIVA ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'maximus 2026'; // Senha integrada conforme solicitado
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV15() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [fotosDb, setFotosDb] = useState([]);
  const [arquivosDb, setArquivosDb] = useState([]);

  // --- BASE LEGAL EXAUSTIVA (PARÁ & NACIONAL) ---
  const baseLegalCompilada = [
    { ref: 'Lei Est. 5.887/95', desc: 'Política Estadual de Meio Ambiente do Pará (Geral).', contexto: 'ESTADUAL' },
    { ref: 'Res. COEMA 162/21', desc: 'Competência Municipal para impacto local no Pará.', contexto: 'MUNICIPAL' },
    { ref: 'Inst. Norm. 11/19', desc: 'Procedimentos de licenciamento na SEMAS/PA.', contexto: 'PROCEDIMENTAL' },
    { ref: 'ANTT 5.998/22', desc: 'Regulamento de Transporte Rodoviário de Produtos Perigosos.', contexto: 'TRANSPORTE' },
    { ref: 'ABNT NBR 14725:2023', desc: 'FDS - Ficha de Dados de Segurança (Antiga FISPQ).', contexto: 'QUÍMICOS' },
    { ref: 'ABNT NBR 15481:2023', desc: 'Checklist de requisitos operacionais para transporte.', contexto: 'OPERACIONAL' },
    { ref: 'CONAMA 273/00', desc: 'Licenciamento de Postos de Combustíveis.', contexto: 'POSTOS' },
    { ref: 'Lei 12.305/10', desc: 'Política Nacional de Resíduos Sólidos (PGRS).', contexto: 'INDÚSTRIA' }
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
    if (!dados.cnpj) return alert("Insira o CNPJ para vincular os dados.");
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* SIDEBAR DESIGN MAXIMUS */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
          <div className="bg-green-500 p-2 rounded-xl"><ShieldCheck size={24}/></div>
          <h1 className="text-lg font-black italic tracking-tighter">SILAM <span className="text-green-400">V15</span></h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Dossiê Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud/>} label="Upload de Provas" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Scale/>} label="Biblioteca Legal" active={aba === 'leis'} onClick={() => setAba('leis')} />
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
        {/* HEADER */}
        <header className="h-16 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
           <div className="flex items-center gap-3">
             <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">PhD Engineering Intelligence</span>
           </div>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-xl">Exportar Documentação</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* DASHBOARD: DADOS DA EMPRESA */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 animate-in fade-in">
               <h2 className="text-2xl font-black text-slate-800 uppercase italic border-l-4 border-green-500 pl-4">Cadastro do Empreendimento</h2>
               <div className="grid grid-cols-2 gap-8">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v)=>setDados({...dados, cnpj: v})}/>
                  <InputGroup label="Endereço Completo" value={dados.endereco} onChange={(v)=>setDados({...dados, endereco: v})}/>
                  <InputGroup label="Técnico Responsável" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                  <InputGroup label="Registro (CREA/CFT)" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                  <InputGroup label="Cidade (SEMMA/SEMAS)" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
               </div>
            </div>
          )}

          {/* BIBLIOTECA LEGAL COMPLETA */}
          {aba === 'leis' && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h2 className="text-2xl font-black text-slate-800 italic uppercase flex items-center gap-3"><Gavel className="text-blue-600"/> Base Jurídica de Sustentação</h2>
              <div className="grid grid-cols-1 gap-3">
                {baseLegalCompilada.map((lei, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-green-500 transition shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:text-green-500 transition"><Scale size={20}/></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-700">{lei.ref}</h4>
                        <p className="text-[11px] text-slate-500 font-bold tracking-tight">{lei.desc}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-slate-100 px-4 py-1.5 rounded-full text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 uppercase">{lei.contexto}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RELATÓRIO FOTOGRÁFICO TÉCNICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in zoom-in">
               <div className="flex justify-between items-end no-print">
                  <h2 className="text-2xl font-black text-slate-800 italic uppercase">Laudo Fotográfico de Campo</h2>
                  <label className="bg-blue-600 text-white px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase cursor-pointer hover:bg-blue-700 shadow-xl transition-all">
                    Inserir Evidências <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'FOTO')}/>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                  {fotosDb.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-[3rem] border shadow-sm break-inside-avoid ring-1 ring-slate-100">
                       <img src={f.url_publica} className="h-72 w-full object-cover rounded-[2.5rem] mb-4 border" alt="Inspeção"/>
                       <textarea className="w-full bg-slate-50 border-none p-5 rounded-2xl text-[11px] font-bold text-slate-600 h-24 italic shadow-inner" placeholder="Descreva a evidência técnica encontrada..."/>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* DOCUMENTOS GERADOS PARA IMPRESSÃO */}
          <div className="print:block">
            {aba === 'print_oficio' && (
              <div className="bg-white p-20 leading-relaxed text-slate-900 font-serif animate-in fade-in">
                <h1 className="text-center font-bold text-2xl uppercase underline mb-24 tracking-tighter">Ofício de Requerimento de Licenciamento</h1>
                <p className="text-right mb-16 font-bold text-lg">{dados.cidade}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="mb-12 font-black text-xl italic">Excelentíssimo Senhor Secretário de Meio Ambiente,</p>
                <p className="indent-12 text-justify mb-10 text-xl leading-relaxed">
                  A empresa <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, inscrita no CNPJ sob o nº <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                  com sede em {dados.endereco || "[ENDEREÇO]"}, vem respeitosamente requerer a 
                  <strong> LICENÇA AMBIENTAL</strong> para suas atividades operacionais, anexando para este fim todos os documentos técnicos exigidos 
                  pelas normas vigentes no Estado do Pará e no Município de {dados.cidade}.
                </p>
                <p className="indent-12 text-justify mb-10 text-xl">Nestes termos, pede e aguarda deferimento.</p>
                <div className="mt-64 flex flex-col items-center">
                  <div className="border-t-2 border-slate-900 w-80 mb-3"></div>
                  <p className="font-black text-sm uppercase">{dados.razao || "Assinatura do Representante Legal"}</p>
                </div>
              </div>
            )}
            
            {aba === 'print_proc' && (
              <div className="bg-white p-20 text-slate-900 leading-loose animate-in fade-in font-serif">
                <h1 className="text-center font-bold text-3xl uppercase mb-20 tracking-widest">Procuração Ambiental</h1>
                <p className="text-xl mb-6"><strong>OUTORGANTE:</strong> {dados.razao || "____________________"}, CNPJ nº {dados.cnpj || "____________________"}.</p>
                <p className="text-xl mb-12"><strong>OUTORGADO:</strong> {dados.tecnico || "____________________"}, Registro {dados.creasql || "____________________"}.</p>
                <p className="text-xl text-justify indent-12">Pelo presente instrumento, o outorgante confere ao outorgado amplos poderes para representar a empresa perante a SEMAS/PA e as Secretarias Municipais do Pará, podendo assinar termos de compromisso, protocolar defesas e cumprir condicionantes ambientais.</p>
                <div className="mt-64 text-center">
                  <p className="mb-20">__________________________________________</p>
                  <p className="font-bold uppercase tracking-widest text-sm">Assinatura com Firma Reconhecida</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// UI HELPER COMPONENTS
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
        className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[1.5rem] focus:border-green-500 font-bold text-slate-700 outline-none transition-all shadow-inner focus:bg-white"
      />
    </div>
  );
}
