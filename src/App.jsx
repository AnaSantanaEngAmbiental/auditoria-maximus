import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Trash2, 
  CheckCircle2, AlertTriangle, FileSignature, Database, HardDrive,
  User, Building2, MapPin, Gavel, LayoutDashboard
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'SUA_ANON_KEY_AQUI'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV9() {
  // --- ESTADOS GLOBAIS ---
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [arquivosDb, setArquivosDb] = useState([]); 
  const [fotosDb, setFotosDb] = useState([]);
  
  // Checklist Baseado no Roteiro de Transporte de Produtos Perigosos [cite: 13, 15, 34]
  const [checklist, setChecklist] = useState([
    { id: 1, cat: 'BÁSICA', desc: 'Cadastro Transportadora (Modelo SEMAS)', status: 'PENDENTE' },
    { id: 2, cat: 'BÁSICA', desc: 'Publicação DOE / Periódico Local', status: 'PENDENTE' },
    { id: 3, cat: 'TÉCNICA', desc: 'Certificado de Inspeção Veicular (CIV)', status: 'PENDENTE' },
    { id: 4, cat: 'TÉCNICA', desc: 'Certificado de Inspeção (CIPP)', status: 'PENDENTE' },
    { id: 5, cat: 'TÉCNICA', desc: 'Extrato de Transporte ANTT', status: 'PENDENTE' },
    { id: 6, cat: 'JURÍDICA', desc: 'Contrato Social / Ato Constitutivo', status: 'PENDENTE' }
  ]);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    if (dados.cnpj.length >= 14) carregarDadosEmpresa();
  }, [dados.cnpj]);

  async function carregarDadosEmpresa() {
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj);
    
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
      processarInteligenciaChecklist(data);
    }
  }

  // --- INTELIGÊNCIA DE AUDITORIA [cite: 6, 7] ---
  const processarInteligenciaChecklist = (arquivos) => {
    let novoChecklist = [...checklist];
    arquivos.forEach(arq => {
      const nome = arq.nome_arquivo.toLowerCase();
      if (nome.includes('civ')) novoChecklist[2].status = 'CONFORME';
      if (nome.includes('cipp')) novoChecklist[3].status = 'CONFORME';
      if (nome.includes('antt')) novoChecklist[4].status = 'CONFORME';
      if (nome.includes('social') || nome.includes('contrato')) novoChecklist[5].status = 'CONFORME';
    });
    setChecklist(novoChecklist);
  };

  // --- ARRASTE E COLE UNIVERSAL [cite: 1, 9] ---
  const handleFileUpload = async (e) => {
    if (!dados.cnpj) return alert("Insira o CNPJ para vincular os arquivos!");
    setLoading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${dados.cnpj}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('processos-ambientais')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(filePath);
        const categoria = file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO';

        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name,
          tipo_arquivo: fileExt,
          url_publica: urlData.publicUrl,
          empresa_cnpj: dados.cnpj,
          categoria: categoria
        }]);
      }
    }
    carregarDadosEmpresa();
    setLoading(false);
  };

  const handlePrint = (target) => {
    setAba(target);
    setTimeout(() => { window.print(); }, 700);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8 text-center justify-center">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-lg shadow-green-500/20"><ShieldCheck size={28}/></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter">MAXIMUS <span className="text-[10px] text-green-400 font-normal">v9.0</span></h1>
            <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Auditoria Ambiental</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<LayoutDashboard />} label="Dashboard Principal" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud />} label="Arraste e Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<ClipboardList />} label="Checklist Técnico" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera />} label="Relatório de Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Gerador de Docs" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>

        <div className="mt-auto bg-slate-800/40 p-5 rounded-[2rem] border border-slate-700/50">
          <label className="text-[9px] font-black text-slate-500 uppercase block mb-3 px-1 text-center">Filtro por CNPJ Ativo</label>
          <input 
            className="w-full bg-slate-900 border-none text-xs font-bold p-3 rounded-xl text-center focus:ring-2 ring-green-500 outline-none"
            value={dados.cnpj} onChange={(e) => setDados({...dados, cnpj: e.target.value})}
            placeholder="00.000.000/0001-00"
          />
        </div>
      </aside>

      {/* ÁREA DE TRABALHO */}
      <main className="flex-1 overflow-y-auto relative bg-[#F8FAFC]">
        
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex justify-between items-center px-10 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-3">
             <div className={`h-3 w-3 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {loading ? "Processando Inteligência de Dados..." : `Sincronizado: ${dados.razao || 'Aguardando Empresa'}`}
             </h2>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-xl">
            Exportar Dossiê Completo
          </button>
        </header>

        <div className="p-10 max-w-6xl mx-auto">

          {/* ABA: DASHBOARD / DADOS */}
          {aba === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase mb-8 flex items-center gap-3">
                  <Building2 className="text-blue-500" /> Cadastro do Proponente
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="Razão Social" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
                  <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
                  <InputGroup label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
                  <InputGroup label="CREA/Registro" value={dados.creasql} onChange={(v) => setDados({...dados, creasql: v})} />
                  <InputGroup label="Endereço" value={dados.endereco} onChange={(v) => setDados({...dados, endereco: v})} />
                  <InputGroup label="Cidade/UF" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
                </div>
              </div>
            </div>
          )}

          {/* ABA: ARRASTE E COLE [cite: 1, 9] */}
          {aba === 'upload' && (
            <div className="space-y-8 animate-in zoom-in duration-300">
               <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center hover:border-green-400 transition-all group relative">
                  <UploadCloud size={64} className="mx-auto mb-6 text-slate-300 group-hover:text-green-500 transition-all group-hover:scale-110" />
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Ingestão Universal Maximus</h3>
                  <p className="text-slate-400 font-bold text-sm mb-10 tracking-tight">Suporta: PDF, XLSX, DOCX, JSON e Imagens Técnicas</p>
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                  <span className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Carregar Documentação</span>
               </div>
               
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[10px] uppercase mb-6 flex items-center gap-2">
                    <Database size={16} className="text-blue-500"/> Arquivos Identificados ({arquivosDb.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {arquivosDb.map((arq, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <FileText size={18} className="text-blue-400 flex-shrink-0" />
                             <span className="text-[11px] font-black text-slate-600 truncate uppercase">{arq.nome_arquivo}</span>
                          </div>
                          <a href={arq.url_publica} target="_blank" rel="noreferrer" className="bg-white p-2 rounded-lg border text-slate-400 hover:text-blue-500 hover:border-blue-500 transition shadow-sm">
                             <Printer size={14}/>
                          </a>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* ABA: CHECKLIST [cite: 7, 34] */}
          {aba === 'checklist' && (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-right">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b">
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-8">Categoria</th>
                        <th className="p-8">Exigência do Roteiro (LO)</th>
                        <th className="p-8 text-center">Status Auditoria</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {checklist.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50 transition group">
                          <td className="p-8"><span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[9px] font-black">{item.cat}</span></td>
                          <td className="p-8 text-xs font-black text-slate-700 uppercase tracking-tight">{item.desc}</td>
                          <td className="p-8">
                             <div className={`mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${
                               item.status === 'CONFORME' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500 animate-pulse'
                             }`}>
                               {item.status === 'CONFORME' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>} {item.status}
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* ABA: FOTOS [cite: 9, 42] */}
          {aba === 'fotos' && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in">
               {fotosDb.map((f, i) => (
                 <div key={i} className="bg-white p-5 rounded-[2.5rem] border shadow-sm break-inside-avoid">
                    <img src={f.url_publica} className="h-72 w-full object-cover rounded-[2rem] mb-5 shadow-inner" alt="Evidência Técnica" />
                    <textarea 
                      placeholder="Descreva a evidência conforme norma NBR 15480..."
                      className="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none text-[11px] font-bold text-slate-500 h-24 italic"
                      defaultValue={f.legenda_tecnica}
                    />
                 </div>
               ))}
               {fotosDb.length === 0 && <p className="col-span-2 text-center text-slate-400 font-bold p-20 uppercase tracking-widest italic">Nenhuma foto carregada para este CNPJ.</p>}
            </div>
          )}

          {/* ABA: DOCS [cite: 7, 20] */}
          {aba === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <DocActionCard title="Ofício Requerimento Padrão" icon={<FileText />} onClick={() => handlePrint('print_oficio')} />
               <DocActionCard title="Procuração Ambiental" icon={<FileSignature />} onClick={() => handlePrint('print_procuracao')} />
            </div>
          )}

          {/* --- ÁREA EXCLUSIVA DE IMPRESSÃO (PDF) --- */}
          <div className="hidden print:block p-0 bg-white text-black font-serif">
             {aba === 'print_oficio' && (
               <div className="p-16 leading-loose">
                  <div className="text-center mb-20 border-b-2 border-black pb-8">
                     <h1 className="text-2xl font-bold uppercase tracking-[0.2em]">Requerimento de Licenciamento Ambiental</h1>
                     <p className="text-xs mt-2 italic">Estado do Pará - SEMAS/SEMMA</p>
                  </div>
                  <p className="text-right mb-12">{dados.cidade}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="mb-10 font-bold">À Secretaria Municipal de Meio Ambiente</p>
                  <p className="indent-12 text-justify mb-8 leading-relaxed">
                     O requerente <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, inscrito no CNPJ/CPF <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                     situado em {dados.endereco || "[ENDEREÇO]"}, vem respeitosamente requerer a concessão da 
                     <strong> LICENÇA DE OPERAÇÃO (LO)</strong> para a atividade de transporte rodoviário de produtos perigosos, 
                     conforme roteiro orientativo vigente[cite: 14].
                  </p>
                  <p className="indent-12 text-justify mb-32">Nestes termos, pede e espera deferimento.</p>
                  <div className="flex flex-col items-center">
                     <div className="border-t border-black w-80 mb-2"></div>
                     <p className="font-bold uppercase text-xs">{dados.razao || "Assinatura"}</p>
                  </div>
               </div>
             )}

             {aba === 'print_procuracao' && (
               <div className="p-16 text-sm leading-relaxed">
                  <h1 className="text-center font-bold text-2xl uppercase underline mb-16 tracking-widest">PROCURAÇÃO AD NEGOTIA</h1>
                  <p className="mb-8"><strong>OUTORGANTE:</strong> {dados.razao || "____________________"}, portador do CNPJ nº {dados.cnpj || "____________________"}.</p>
                  <p className="mb-8"><strong>OUTORGADO:</strong> {dados.tecnico || "____________________"}, Engenheiro(a), Registro {dados.creasql || "____________________"}.</p>
                  <p className="text-justify mb-10 leading-loose">
                    <strong>PODERES:</strong> Amplos e específicos poderes para representar o outorgante perante a 
                    SECRETARIA DE ESTADO DE MEIO AMBIENTE E SUSTENTABILIDADE – SEMAS/PA e demais órgãos ambientais municipais do Pará[cite: 9, 20].
                  </p>
                  <div className="mt-48 flex flex-col items-center">
                     <div className="border-t border-black w-80 mb-2"></div>
                     <p className="font-bold uppercase text-xs">Assinatura do Outorgante</p>
                  </div>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}

// --- COMPONENTES DE INTERFACE ---
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
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#F1F5F9] border-2 border-transparent p-4 rounded-3xl outline-none focus:bg-white focus:border-green-500 transition-all font-bold text-slate-700 shadow-sm"
      />
    </div>
  );
}

function DocActionCard({ title, icon, onClick }) {
  return (
    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 text-center hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group" onClick={onClick}>
      <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition shadow-inner">{icon}</div>
      <h4 className="font-black text-slate-800 uppercase italic text-lg">{title}</h4>
      <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-widest">Preparar para Impressão</p>
    </div>
  );
}

function ClipboardList(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
}
