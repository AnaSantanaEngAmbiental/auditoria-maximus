import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Clock, CheckCircle, Scale, FileOutput, MapPin, HardDrive
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV13() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [fotosDb, setFotosDb] = useState([]);
  const [arquivosDb, setArquivosDb] = useState([]);

  // --- BASE LEGAL COMPLETA (PARÁ & NACIONAL) ---
  const baseLegalCompilada = [
    { ref: 'Lei Est. 5.887/95', desc: 'Política Estadual de Meio Ambiente do Pará.', contexto: 'Geral' },
    { ref: 'Res. COEMA 162/21', desc: 'Competência Municipal para licenciamento local no Pará.', contexto: 'Municípios' },
    { ref: 'CONAMA 237/97', desc: 'Procedimentos e critérios para Licenciamento Ambiental.', contexto: 'Geral' },
    { ref: 'ANTT 5.998/22', desc: 'Regulamento de Transporte Rodoviário de Produtos Perigosos.', contexto: 'Transporte' },
    { ref: 'NBR 14725:2023', desc: 'FDS - Ficha de Dados de Segurança (Antiga FISPQ).', contexto: 'Químicos' },
    { ref: 'NBR 15481:2023', desc: 'Checklist de requisitos operacionais, saúde e segurança.', contexto: 'Operacional' },
    { ref: 'NBR 15480:2021', desc: 'Plano de Ação de Emergência (PAE).', contexto: 'Emergência' },
    { ref: 'Lei 12.305/10', desc: 'Política Nacional de Resíduos Sólidos.', contexto: 'Fábricas/Indústrias' }
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
    <div className="flex h-screen bg-[#F1F5F9] font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-2 mb-10 border-b border-slate-700 pb-6">
          <ShieldCheck className="text-green-500" size={28}/>
          <h1 className="text-lg font-black italic uppercase tracking-tighter">MAXIMUS <span className="text-green-400">v13</span></h1>
        </div>
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Dossiê Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud/>} label="Arraste e Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Scale/>} label="Base Legal Completa" active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera/>} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature/>} label="Gerador de Ofício" active={aba === 'print_oficio'} onClick={() => setAba('print_oficio')} />
          <MenuBtn icon={<FileOutput/>} label="Procuração" active={aba === 'print_proc'} onClick={() => setAba('print_proc')} />
        </nav>
        <div className="mt-auto p-4 bg-slate-900 rounded-2xl border border-slate-700">
           <p className="text-[9px] font-black text-slate-500 uppercase mb-2">CNPJ em Análise</p>
           <input className="w-full bg-transparent border-none text-xs font-bold text-green-400 outline-none" value={dados.cnpj} onChange={(e)=>setDados({...dados, cnpj: e.target.value})}/>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* HEADER */}
        <header className="h-16 bg-white border-b flex justify-between items-center px-10 no-print">
           <div className="flex items-center gap-3">
             <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PhD Engineering Intelligence</span>
           </div>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Imprimir Documento</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* ABA: BASE LEGAL */}
          {aba === 'leis' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-black text-slate-800 italic uppercase">Arcabouço Legal do Licenciamento</h2>
              <div className="grid grid-cols-1 gap-3">
                {baseLegalCompilada.map((lei, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-blue-500 transition shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-blue-500 transition"><Gavel size={20}/></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-700">{lei.ref}</h4>
                        <p className="text-[11px] text-slate-500 font-bold tracking-tight">{lei.desc}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400">{lei.contexto}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in zoom-in">
               <div className="flex justify-between items-center no-print">
                  <h2 className="text-xl font-black text-slate-800 italic uppercase">Relatório Fotográfico Técnico</h2>
                  <label className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer hover:bg-blue-700 shadow-lg">
                    Inserir Fotos de Inspeção <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'FOTO')}/>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                  {fotosDb.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-[3rem] border shadow-sm break-inside-avoid">
                       <img src={f.url_publica} className="h-64 w-full object-cover rounded-[2rem] mb-4 border" alt="Evidência"/>
                       <textarea className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold text-slate-600" placeholder="Digite a legenda técnica (Ex: Placas de identificação e telefones de emergência conforme NBR 7500)..."/>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* DOCUMENTOS PARA IMPRESSÃO */}
          <div className="print:block">
            {aba === 'print_oficio' && (
              <div className="bg-white p-16 leading-relaxed text-slate-800 animate-in fade-in">
                <h1 className="text-center font-bold text-xl uppercase underline mb-20">Ofício de Requerimento Padrão</h1>
                <p className="text-right mb-12">{dados.cidade}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="mb-10 font-bold">À Secretaria de Meio Ambiente de {dados.cidade}</p>
                <p className="indent-12 text-justify mb-8">
                  O requerente <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, portador do CNPJ <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                  vem requerer a análise para fins de Licenciamento Ambiental para a atividade de transporte e logística, 
                  conforme roteiro orientativo da SEMAS/PA[cite: 12, 13, 14].
                </p>
                <div className="mt-40 flex flex-col items-center">
                  <div className="border-t border-black w-72 mb-2"></div>
                  <p className="font-bold text-xs uppercase">{dados.razao || "Assinatura do Responsável"}</p>
                </div>
              </div>
            )}
            
            {aba === 'print_proc' && (
              <div className="bg-white p-16 text-sm leading-loose text-justify animate-in fade-in">
                <h1 className="text-center font-bold text-2xl uppercase mb-16">Procuração Ambiental</h1>
                <p><strong>OUTORGANTE:</strong> {dados.razao || "____________________"}, CNPJ nº {dados.cnpj || "____________________"}.</p>
                <p><strong>OUTORGADO:</strong> {dados.tecnico || "____________________"}, Registro {dados.creasql || "____________________"}.</p>
                <p className="mt-8">Pelo presente instrumento, o outorgante confere ao outorgado poderes para representar a empresa perante a SEMAS/PA e Secretarias Municipais do Pará, podendo assinar termos, protocolos e cumprir condicionantes[cite: 7, 20].</p>
              </div>
            )}
          </div>

          {/* ABA DASHBOARD */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 animate-in fade-in">
               <h2 className="text-2xl font-black text-slate-800 uppercase italic">Dados do Empreendimento</h2>
               <div className="grid grid-cols-2 gap-8">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v)=>setDados({...dados, cnpj: v})}/>
                  <InputGroup label="Endereço Completo" value={dados.endereco} onChange={(v)=>setDados({...dados, endereco: v})}/>
                  <InputGroup label="Técnico Responsável" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                  <InputGroup label="Registro (CREA/CFT)" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                  <InputGroup label="Município (SEMMA)" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-lg shadow-green-900/40 translate-x-1' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}> {icon} {label} </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-green-500 font-bold text-slate-700 outline-none transition-all shadow-inner focus:bg-white"/>
    </div>
  );
}
