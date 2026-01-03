import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Gavel, 
  CheckCircle2, AlertTriangle, FileSignature, Database, 
  Building2, Clock, CheckCircle, Scale, FileOutput
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV12() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({ razao: '', cnpj: '', tecnico: '', creasql: '', cidade: 'Belém' });
  const [fotosDb, setFotosDb] = useState([]);
  const [arquivosDb, setArquivosDb] = useState([]);

  // BASE LEGAL INTEGRADA (SEMAS/COEMA)
  const baseLegal = [
    { ref: 'Lei Complementar 140/2011', desc: 'Fixa normas de cooperação entre União, Estados e Municípios (Competência Comum).' },
    { ref: 'Resolução COEMA 162/2021', desc: 'Define atividades de impacto local de competência dos Municípios do Pará.' },
    { ref: 'Lei Estadual 5.887/1995', desc: 'Política Estadual do Meio Ambiente do Pará.' },
    { ref: 'Resolução ANTT 5.998/2022', desc: 'Regulamento para Transporte Rodoviário de Produtos Perigosos.' },
    { ref: 'Instrução Normativa 11/2019', desc: 'Procedimentos para licenciamento ambiental no âmbito da SEMAS/PA.' },
    { ref: 'ABNT NBR 14725:2023', desc: 'Ficha de Dados de Segurança (FDS) e Rotulagem de produtos químicos.' }
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
    if (!dados.cnpj) return alert("Insira o CNPJ");
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
      {/* SIDEBAR DESIGN MAXIMUS */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 shadow-2xl no-print">
        <div className="flex items-center gap-2 mb-10 border-b border-slate-700 pb-6">
          <ShieldCheck className="text-green-500" size={28}/>
          <h1 className="text-lg font-black italic">SILAM <span className="text-green-400">v12.0</span></h1>
        </div>
        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2/>} label="Dossiê" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<Scale/>} label="Base Legal" active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera/>} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileOutput/>} label="Gerar Laudo" active={aba === 'laudo'} onClick={() => setAba('laudo')} />
        </nav>
        <div className="p-4 bg-slate-800 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Monitorando CNPJ</p>
          <input className="w-full bg-slate-900 border-none text-xs p-2 rounded text-green-400" value={dados.cnpj} onChange={(e)=>setDados({...dados, cnpj: e.target.value})}/>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b flex justify-between items-center px-10 no-print">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado do Pará - Gestão de Licenciamento</span>
          <button onClick={()=>window.print()} className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Gerar PDF para SEMAS</button>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          
          {/* ABA: BASE LEGAL AMBIENTAL */}
          {aba === 'leis' && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h2 className="text-xl font-black text-slate-800 italic uppercase">Fundamentação Jurídica do Processo</h2>
              <div className="grid grid-cols-1 gap-4">
                {baseLegal.map((lei, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 flex gap-4 hover:border-blue-400 transition">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Gavel size={24}/></div>
                    <div>
                      <h4 className="font-bold text-slate-700">{lei.ref}</h4>
                      <p className="text-xs text-slate-500 font-medium">{lei.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: GERADOR DE RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 italic uppercase">Relatório Fotográfico de Inspeção</h2>
                <label className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase cursor-pointer">
                  Subir Evidências <input type="file" multiple hidden onChange={(e)=>handleFileUpload(e, 'FOTO')}/>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-8 print:grid-cols-1">
                {fotosDb.map((foto, i) => (
                  <div key={i} className="bg-white p-4 rounded-[2.5rem] border shadow-sm break-inside-avoid">
                    <img src={foto.url_publica} className="h-64 w-full object-cover rounded-[2rem] mb-4 border" alt="Inspeção"/>
                    <div className="px-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Registro de Campo #{i+1}</p>
                      <textarea 
                        className="w-full bg-slate-50 border-none p-4 rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 ring-green-500"
                        placeholder="Insira a legenda técnica aqui (Ex: Verificação de bacia de contenção...)"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: DOSSIÊ DO CLIENTE */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Dados do Proponente</h2>
              <div className="grid grid-cols-2 gap-6">
                 <InputGroup label="Razão Social" value={dados.razao} onChange={(v)=>setDados({...dados, razao: v})}/>
                 <InputGroup label="Responsável Técnico" value={dados.tecnico} onChange={(v)=>setDados({...dados, tecnico: v})}/>
                 <InputGroup label="CREA/PA" value={dados.creasql} onChange={(v)=>setDados({...dados, creasql: v})}/>
                 <InputGroup label="Município do Licenciamento" value={dados.cidade} onChange={(v)=>setDados({...dados, cidade: v})}/>
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
    }`}> {icon} {label} </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl focus:border-green-500 font-bold text-slate-700 outline-none"/>
    </div>
  );
}
