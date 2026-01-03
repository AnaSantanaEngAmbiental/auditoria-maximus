import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Trash2, 
  CheckCircle2, AlertTriangle, FileSignature, Database, HardDrive,
  User, Building2, Calendar, Clock, CheckCircle, XCircle, MapPin
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; // Substitua pela sua chave anon
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV10() {
  // --- ESTADOS ---
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [arquivosDb, setArquivosDb] = useState([]); 
  const [fotosDb, setFotosDb] = useState([]);
  
  // Checklist com Lógica de Vigência Integrada
  const [checklist, setChecklist] = useState([
    { id: 1, cat: 'BÁSICA', desc: 'Cadastro Modelo SEMAS', status: 'PENDENTE', validade: '', dias: null },
    { id: 2, cat: 'TÉCNICA', desc: 'Certificado CIV (Inspeção Veicular)', status: 'PENDENTE', validade: '', dias: null },
    { id: 3, cat: 'TÉCNICA', desc: 'Certificado CIPP (Tanque/Equip.)', status: 'PENDENTE', validade: '', dias: null },
    { id: 4, cat: 'TÉCNICA', desc: 'Curso MOPP (Motorista)', status: 'PENDENTE', validade: '', dias: null },
    { id: 5, cat: 'TÉCNICA', desc: 'Extrato de Transporte ANTT', status: 'PENDENTE', validade: '', dias: null },
    { id: 6, cat: 'JURÍDICA', desc: 'Procuração Registrada', status: 'PENDENTE', validade: '', dias: null }
  ]);

  // Carregar dados sempre que o CNPJ for alterado
  useEffect(() => {
    if (dados.cnpj.length >= 14) carregarDossiêEmpresa();
  }, [dados.cnpj]);

  async function carregarDossiêEmpresa() {
    const { data } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj);
    
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
      processarAuditoria(data);
    }
  }

  // --- CALCULADORA DE VIGÊNCIA (LOGICA DE PRAZOS) ---
  const calcularDiasParaVencer = (dataFim) => {
    if (!dataFim) return null;
    const diff = new Date(dataFim) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const processarAuditoria = (arquivos) => {
    let novoCheck = [...checklist];
    arquivos.forEach(arq => {
      const nome = arq.nome_arquivo.toLowerCase();
      
      const validar = (index, dataSimulada) => {
        novoCheck[index].status = 'CONFORME';
        novoCheck[index].validade = dataSimulada || '2025-12-31'; // Data padrão para teste
        novoCheck[index].dias = calcularDiasParaVencer(novoCheck[index].validade);
      };

      if (nome.includes('semas')) validar(0);
      if (nome.includes('civ')) validar(1, '2025-06-15'); // Exemplo: Vence logo
      if (nome.includes('cipp')) validar(2, '2025-02-10'); // Exemplo: Alerta Vermelho
      if (nome.includes('mopp')) validar(3, '2026-01-01'); // Exemplo: Verde
      if (nome.includes('antt')) validar(4);
      if (nome.includes('procuracao')) validar(5);
    });
    setChecklist(novoCheck);
  };

  // --- ARRASTE E COLE (UPLOAD COM INTELIGÊNCIA) ---
  const handleFileUpload = async (e) => {
    if (!dados.cnpj) return alert("Por favor, informe o CNPJ antes do upload.");
    setLoading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const filePath = `${dados.cnpj}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('processos-ambientais')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(filePath);
        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name,
          tipo_arquivo: file.name.split('.').pop(),
          url_publica: urlData.publicUrl,
          empresa_cnpj: dados.cnpj,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    }
    carregarDossiêEmpresa();
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* BARRA LATERAL */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8 justify-center">
          <div className="bg-green-500 p-2 rounded-2xl shadow-lg"><ShieldCheck size={28}/></div>
          <h1 className="text-xl font-black italic">MAXIMUS <span className="text-[10px] text-green-400 font-normal">v10.0</span></h1>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<Building2 />} label="Dados do Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud />} label="Arraste & Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Clock />} label="Prazos & Vigência" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera />} label="Relatório de Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Gerar Documentos" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>

        <div className="bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 px-2 text-center">Empresa Selecionada (CNPJ)</p>
          <input 
            className="w-full bg-slate-900 border-none text-xs font-bold p-3 rounded-xl text-center text-green-400 focus:ring-2 ring-green-500 outline-none"
            value={dados.cnpj} onChange={(e) => setDados({...dados, cnpj: e.target.value})}
            placeholder="00.000.000/0001-00"
          />
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <header className="h-20 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
          <div className="flex items-center gap-3">
             <div className={`h-3 w-3 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Auditando: {dados.razao || "Aguardando Cadastro"}</h2>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-xl">Imprimir Dossiê</button>
        </header>

        <div className="p-10 max-w-6xl mx-auto">

          {/* ABA: VIGÊNCIA (O CÉREBRO DO SISTEMA) */}
          {aba === 'checklist' && (
            <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase">Painel de Vigência Ambiental</h3>
                <span className="text-[10px] font-bold text-slate-400">Prazos automáticos baseados em normas SEMAS/PA</span>
              </div>
              
              {checklist.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm group hover:shadow-md transition">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-[1.5rem] ${item.status === 'CONFORME' ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-400'}`}>
                      {item.status === 'CONFORME' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.cat}</span>
                      <h4 className="font-bold text-slate-700 uppercase text-sm">{item.desc}</h4>
                    </div>
                  </div>

                  {item.status === 'CONFORME' ? (
                    <div className="text-right flex items-center gap-8">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Vencimento</p>
                          <p className="text-xs font-bold text-slate-600">{new Date(item.validade).toLocaleDateString()}</p>
                       </div>
                       <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase ${
                         item.dias < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 
                         item.dias < 90 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                       }`}>
                         {item.dias} Dias Restantes
                       </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase italic">Aguardando Documento</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ABA: ARRASTE E COLE */}
          {aba === 'upload' && (
            <div className="space-y-8 animate-in zoom-in">
              <div className="bg-white border-4 border-dashed border-slate-200 rounded-[4rem] p-24 text-center hover:border-green-400 transition-all group relative">
                <UploadCloud size={64} className="mx-auto mb-6 text-slate-300 group-hover:text-green-500 transition-all group-hover:scale-110" />
                <h3 className="text-2xl font-black text-slate-800 uppercase italic">Ingestão de Dados Maximus</h3>
                <p className="text-slate-400 font-bold text-sm mb-10">CIV, CIPP, MOPP, ANTT, PDF ou FOTOS</p>
                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                <button className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black uppercase text-[10px] shadow-2xl">Processar Arquivos</button>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 text-[10px] uppercase mb-6 flex items-center gap-2">
                  <Database size={16} className="text-blue-500"/> Acervo Digital ({arquivosDb.length})
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   {arquivosDb.map((arq, i) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <FileText size={18} className="text-blue-400 flex-shrink-0" />
                           <span className="text-[10px] font-black text-slate-600 truncate uppercase">{arq.nome_arquivo}</span>
                        </div>
                        <a href={arq.url_publica} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition"><Printer size={16}/></a>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA: DADOS DO CLIENTE */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 animate-in fade-in">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-10 flex items-center gap-3"><Building2 className="text-blue-500"/> Ficha Cadastral</h3>
              <div className="grid grid-cols-2 gap-8">
                <InputGroup label="Razão Social" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
                <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
                <InputGroup label="Endereço" value={dados.endereco} onChange={(v) => setDados({...dados, endereco: v})} />
                <InputGroup label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
                <InputGroup label="Registro Profissional" value={dados.creasql} onChange={(v) => setDados({...dados, creasql: v})} />
                <InputGroup label="Cidade Atuação" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              </div>
            </div>
          )}

          {/* ABA: FOTOS */}
          {aba === 'fotos' && (
            <div className="grid grid-cols-2 gap-10 animate-in fade-in">
               {fotosDb.map((f, i) => (
                 <div key={i} className="bg-white p-5 rounded-[3rem] border shadow-sm break-inside-avoid">
                    <img src={f.url_publica} className="h-72 w-full object-cover rounded-[2.5rem] mb-5 shadow-inner" alt="Evidência" />
                    <textarea 
                      placeholder="Legenda técnica para o relatório fotográfico..."
                      className="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none text-[10px] font-bold text-slate-500 h-24 italic"
                      defaultValue={f.legenda_tecnica}
                    />
                 </div>
               ))}
            </div>
          )}

        </div>

        {/* --- ÁREA DE IMPRESSÃO (ESCONDIDA) --- */}
        <div className="hidden print:block p-12 bg-white text-black font-serif">
           {aba === 'docs' && <p className="text-center italic">Selecione o documento específico para imprimir.</p>}
        </div>

      </main>
    </div>
  );
}

// --- UI COMPONENTS ---
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase tracking-tight ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-2' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
    }`}>
      {React.cloneElement(icon, { size: 18 })} {label}
    </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-3xl outline-none focus:bg-white focus:border-green-500 transition-all font-bold text-slate-700"
      />
    </div>
  );
}
