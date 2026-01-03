import React, { useState, useCallback } from 'react';
import { 
  ShieldCheck, Truck, FileText, ClipboardList, Camera, 
  Printer, Trash2, Plus, CheckCircle2, AlertTriangle, 
  User, Building2, MapPin, FileSignature, Download, Gavel, UploadCloud, FileJson, FileType
} from 'lucide-react';

// --- CONFIGURAÇÃO DE ATIVIDADES ---
const ROTEIROS_INFO = {
  transp_perigoso: { nome: "Transporte de Produtos Perigosos", cor: "blue" },
  posto_combustivel: { nome: "Posto de Combustíveis", cor: "green" },
  madeira: { nome: "Depósitos de Madeira / Serrarias", cor: "amber" },
  oficina: { nome: "Oficinas e Concessionárias", cor: "slate" }
};

export default function SilamMaximusV7() {
  const [aba, setAba] = useState('dashboard');
  const [roteiro, setRoteiro] = useState('transp_perigoso');
  const [arquivos, setArquivos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  // --- LOGICA DE ARRASTE E COLE (DROPZONE) ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      const fileData = {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleDateString(),
        url: URL.createObjectURL(file)
      };

      if (file.type.startsWith('image/')) {
        setFotos(prev => [...prev, { ...fileData, legenda: '' }]);
      } else {
        setArquivos(prev => [...prev, fileData]);
      }
    });
  };

  const handlePrint = (targetAba) => {
    setAba(targetAba);
    setTimeout(() => { window.print(); }, 500);
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden font-sans">
      
      {/* SIDEBAR (NAV) */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-lg shadow-green-500/20 animate-pulse"><ShieldCheck size={28}/></div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter">MAXIMUS <span className="text-[10px] text-green-400 font-normal">v7.0</span></h1>
            <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">Environmental Intelligence</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<User />} label="Dados do Proponente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud />} label="Arraste & Cole (Upload)" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<ClipboardList />} label="Checklist de Auditoria" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera />} label="Relatório Fotográfico" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Gerador de Documentos" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>

        <div className="mt-auto bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50">
          <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 px-1">Atividade Selecionada</label>
          <select 
            className="w-full bg-slate-900 border-none text-xs font-bold p-3 rounded-xl focus:ring-2 ring-green-500 outline-none"
            value={roteiro} onChange={(e) => setRoteiro(e.target.value)}
          >
            {Object.keys(ROTEIROS_INFO).map(k => <option key={k} value={k}>{ROTEIROS_INFO[k].nome}</option>)}
          </select>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto relative bg-[#F8FAFC]">
        
        {/* BARRA SUPERIOR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex justify-between items-center px-10 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-3">
             <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizado com SEMAS/PA</h2>
          </div>
          <div className="flex gap-4">
             <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase hover:bg-blue-600 transition shadow-xl">Imprimir Dossiê</button>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">

          {/* ABA: ARRASTE E COLE (UPLOAD UNIVERSAL) */}
          {aba === 'upload' && (
            <div className="space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-green-400 transition-all group">
                  <div className="bg-green-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-green-600 group-hover:scale-110 transition">
                    <UploadCloud size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic">Ingestão de Dados Maximus</h3>
                  <p className="text-slate-400 font-bold text-sm mb-8">Solte aqui: PDF, XLSX, DOCX, JSON ou FOTOS (JPEG/PNG)</p>
                  <label className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs cursor-pointer hover:bg-green-600 transition shadow-2xl">
                    Selecionar Arquivos
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
               </div>

               {/* LISTA DE DOCUMENTOS PROCESSADOS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <h4 className="font-black text-slate-800 uppercase text-xs mb-6 flex items-center gap-2">
                       <FileText className="text-blue-500" /> Documentos e Planilhas ({arquivos.length})
                     </h4>
                     <div className="space-y-3">
                        {arquivos.map((file, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-3">
                                {file.name.endsWith('.json') ? <FileJson className="text-amber-500" size={18}/> : <FileType className="text-blue-500" size={18}/>}
                                <span className="text-[11px] font-black text-slate-600 uppercase truncate w-40">{file.name}</span>
                             </div>
                             <span className="text-[9px] font-bold text-slate-400">{file.size}</span>
                             <button onClick={() => setArquivos(arquivos.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <h4 className="font-black text-slate-800 uppercase text-xs mb-6 flex items-center gap-2">
                       <Camera className="text-green-500" /> Banco de Imagens ({fotos.length})
                     </h4>
                     <div className="grid grid-cols-4 gap-2">
                        {fotos.map((foto, i) => (
                          <div key={i} className="relative group aspect-square overflow-hidden rounded-xl border">
                             <img src={foto.url} className="object-cover w-full h-full" />
                             <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* ABA: DADOS DO CLIENTE */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-blue-50 p-4 rounded-3xl text-blue-600"><Building2 size={32}/></div>
                <h3 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Perfil do Empreendimento</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup label="Razão Social / Nome Completo" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
                <InputGroup label="CNPJ / CPF" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
                <InputGroup label="Endereço de Localização" value={dados.endereco} onChange={(v) => setDados({...dados, endereco: v})} />
                <InputGroup label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
                <InputGroup label="Registro Profissional (CREA/CRBio)" value={dados.creasql} onChange={(v) => setDados({...dados, creasql: v})} />
                <InputGroup label="Município / Estado" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              </div>
            </div>
          )}

          {/* ABA: RELATÓRIO FOTOGRÁFICO (PARA IMPRESSÃO) */}
          {aba === 'fotos' && (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-8">
                  {fotos.map((f, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2.5rem] border shadow-sm break-inside-avoid">
                       <img src={f.url} className="h-64 w-full object-cover rounded-[2rem] mb-4 shadow-inner" />
                       <textarea 
                         placeholder="Descreva a evidência técnica observada..."
                         className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-[11px] font-bold text-slate-500 h-24 italic"
                         value={f.legenda}
                         onChange={(e) => {
                           const newFotos = [...fotos];
                           newFotos[i].legenda = e.target.value;
                           setFotos(newFotos);
                         }}
                       />
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* ABA: GERADOR DE DOCS */}
          {aba === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <DocActionCard title="Ofício Requerimento" icon={<FileText />} onClick={() => handlePrint('print_oficio')} />
               <DocActionCard title="Procuração Ambiental" icon={<FileSignature />} onClick={() => handlePrint('print_procuracao')} />
            </div>
          )}

        </div>

        {/* --- ÁREA EXCLUSIVA DE IMPRESSÃO --- */}
        <div className="hidden print:block p-0 bg-white text-black font-serif">
           {aba === 'print_oficio' && (
             <div className="p-20 leading-loose">
                <div className="text-center mb-20 border-b-2 border-black pb-6">
                   <h1 className="text-2xl font-bold uppercase tracking-widest">Requerimento de Licenciamento Ambiental</h1>
                </div>
                <p className="text-right mb-12">{dados.cidade || "Belém"}/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="mb-10 font-bold">À Secretaria Municipal de Meio Ambiente</p>
                <p className="indent-12 text-justify mb-8">
                   O requerente <strong>{dados.razao || "[NOME COMPLETO]"}</strong>, portador do CNPJ/CPF <strong>{dados.cnpj || "[DOCUMENTO]"}</strong>, 
                   com sede em {dados.endereco || "[ENDEREÇO]"}, vem respeitosamente requerer a concessão da 
                   <strong> LICENÇA DE OPERAÇÃO</strong> para a atividade de {ROTEIROS_INFO[roteiro].nome}, 
                   declarando estar ciente de todas as normas ambientais vigentes no Estado do Pará.
                </p>
                <p className="indent-12 text-justify mb-32">Nestes termos, pede e espera deferimento.</p>
                <div className="flex flex-col items-center">
                   <div className="border-t border-black w-80 mb-2"></div>
                   <p className="font-bold uppercase text-xs">{dados.razao || "Assinatura do Requerente"}</p>
                </div>
             </div>
           )}

           {aba === 'print_procuracao' && (
             <div className="p-20 text-sm leading-relaxed">
                <h1 className="text-center font-bold text-2xl uppercase underline mb
