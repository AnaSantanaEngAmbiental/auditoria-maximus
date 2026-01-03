import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Truck, FileText, ClipboardList, Camera, 
  Printer, Trash2, Plus, CheckCircle2, AlertTriangle, 
  User, Building2, MapPin, FileSignature, Download, Gavel
} from 'lucide-react';

// --- CONFIGURAÇÃO DE ROTEIROS E LEIS ---
const ROTEIROS_INFO = {
  transp_perigoso: {
    nome: "Transporte de Produtos Perigosos",
    leis: ["ANTT 5.998/22", "Decreto 96.044/88", "Instrução Normativa SEMAS 12/20"],
    docs_obrigatorios: ["CIV", "CIPP", "MOPP", "ANTT"]
  },
  posto_combustivel: {
    nome: "Posto de Combustíveis",
    leis: ["CONAMA 273/00", "CONAMA 319/02", "Portaria INMETRO 109/05"],
    docs_obrigatorios: ["Teste Estanqueidade", "ASME", "Licença LO"]
  },
  oficina_mecanica: {
    nome: "Oficinas e Concessionárias",
    leis: ["CONAMA 358/05", "Lei Est. 5.887/95"],
    docs_obrigatorios: ["PGRS", "CTR", "Alvará Sanitário"]
  }
};

export default function SilamMaximusV6() {
  const [aba, setAba] = useState('dashboard');
  const [roteiro, setRoteiro] = useState('transp_perigoso');
  const [fotos, setFotos] = useState([]);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  // Simulador de Itens de Checklist (Inspirado nos seus CSVs)
  const [checkItens, setCheckItens] = useState([
    { id: 'B01', cat: 'BÁSICA', desc: 'Requerimento Padrão SEMMA assinado', status: 'OK' },
    { id: 'T01', cat: 'TÉCNICA', desc: 'Plano de Gerenciamento de Resíduos Perigosos', status: 'PENDENTE' },
    { id: 'P01', cat: 'PROJETO', desc: 'Projeto de Controle de Poluição Ambiental', status: 'OK' },
    { id: 'D01', cat: 'DIRETRIZ', desc: 'Manter Caixas Separadoras de Água e Óleo limpas', status: 'OK' }
  ]);

  // Função para Impressão
  const handlePrint = (targetAba) => {
    setAba(targetAba);
    setTimeout(() => { window.print(); }, 500);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR (ESCONDIDA NA IMPRESSÃO) */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8">
          <div className="bg-green-500 p-2.5 rounded-2xl shadow-lg shadow-green-500/20"><ShieldCheck size={28}/></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter">MAXIMUS <span className="text-[10px] text-green-400">v6.0</span></h1>
            <p className="text-[9px] uppercase font-bold text-slate-400">Engenharia Ambiental</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<User size={18}/>} label="Dados do Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<ClipboardList size={18}/>} label="Checklist Auditoria" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera size={18}/>} label="Relatório de Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature size={18}/>} label="Documentos Oficiais" active={aba === 'docs'} onClick={() => setAba('docs')} />
          <MenuBtn icon={<Gavel size={18}/>} label="Base Normativa" active={aba === 'leis'} onClick={() => setAba('leis')} />
        </nav>

        <div className="mt-auto bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Atividade em Foco</p>
          <select 
            className="w-full bg-slate-900 text-xs p-2 rounded-lg border-none outline-none text-white font-bold"
            value={roteiro}
            onChange={(e) => setRoteiro(e.target.value)}
          >
            {Object.keys(ROTEIROS_INFO).map(key => (
              <option key={key} value={key}>{ROTEIROS_INFO[key].nome}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* ÁREA DE TRABALHO */}
      <main className="flex-1 overflow-y-auto">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ativo: {ROTEIROS_INFO[roteiro].nome}</h2>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition shadow-lg">
            Imprimir Relatório Completo
          </button>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          
          {/* TELA: DADOS DO CLIENTE */}
          {aba === 'dashboard' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter">Ficha do Empreendimento</h3>
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Razão Social / Nome" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
                <InputGroup label="CNPJ / CPF" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
                <InputGroup label="Endereço Completo" value={dados.endereco} onChange={(v) => setDados({...dados, endereco: v})} />
                <InputGroup label="Responsável Técnico (PhD/Eng)" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
                <InputGroup label="CREA / Registro Profissional" value={dados.creasql} onChange={(v) => setDados({...dados, creasql: v})} />
                <InputGroup label="Cidade de Atuação" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              </div>
            </div>
          )}

          {/* TELA: CHECKLIST DINÂMICO */}
          {aba === 'checklist' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase">
                    <th className="p-6">Cod</th>
                    <th className="p-6">Categoria</th>
                    <th className="p-6">Exigência Técnica / Documental</th>
                    <th className="p-6">Conformidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-bold text-slate-700">
                  {checkItens.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-6 text-slate-400">{item.id}</td>
                      <td className="p-6"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[9px]">{item.cat}</span></td>
                      <td className="p-6 uppercase tracking-tight leading-relaxed">{item.desc}</td>
                      <td className="p-6 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TELA: RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-dashed border-slate-300">
                <div>
                  <h4 className="font-black text-slate-800 uppercase italic">Gestão de Imagens</h4>
                  <p className="text-xs text-slate-400 font-bold">Arraste e solte fotos do empreendimento</p>
                </div>
                <input type="file" multiple className="text-xs" onChange={(e) => {
                  const novas = Array.from(e.target.files).map(f => ({ url: URL.createObjectURL(f), legenda: '' }));
                  setFotos([...fotos, ...novas]);
                }} />
              </div>
              <div className="grid grid-cols-2 gap-8">
                {fotos.map((f, i) => (
                  <div key={i} className="bg-white p-4 rounded-[2.5rem] border shadow-sm group">
                    <img src={f.url} className="h-56 w-full object-cover rounded-[1.5rem] mb-4 shadow-inner" />
                    <textarea 
                      placeholder="Legenda da Foto..."
                      className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none text-[11px] font-bold text-slate-600 h-24"
                      onChange={(e) => {
                        const copy = [...fotos];
                        copy[i].legenda = e.target.value;
                        setFotos(copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TELA: GERADOR DE DOCUMENTOS (OFÍCIO / PROCURAÇÃO) */}
          {aba === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DocPrintCard title="Ofício Requerimento Padrão" icon={<FileText/>} onClick={() => handlePrint('print_oficio')} />
              <DocPrintCard title="Procuração Ambiental" icon={<FileSignature/>} onClick={() => handlePrint('print_procuracao')} />
            </div>
          )}

          {/* ÁREAS DE IMPRESSÃO (INVISÍVEIS NA TELA) */}
          <div className="hidden print:block print:p-0">
            {aba === 'print_oficio' && (
              <div className="bg-white text-black p-12 leading-loose font-serif h-full">
                <div className="text-center mb-16 border-b-2 border-black pb-4">
                  <h1 className="text-2xl font-bold uppercase">Ofício de Requerimento Ambiental</h1>
                </div>
                <p className="text-right mb-10">Belém/PA, {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="mb-10 font-bold">À Secretaria Municipal de Meio Ambiente</p>
                <p className="indent-12 text-justify mb-10">
                  A empresa <strong>{dados.razao || "[RAZÃO SOCIAL]"}</strong>, inscrita no CNPJ sob o nº <strong>{dados.cnpj || "[CNPJ]"}</strong>, 
                  com endereço em {dados.endereco || "[ENDEREÇO]"}, vem por meio deste requerer a concessão de 
                  <strong> LICENÇA DE OPERAÇÃO</strong> para a atividade de {ROTEIROS_INFO[roteiro].nome}.
                </p>
                <p className="indent-12 text-justify mb-20">Nestes termos, pede deferimento.</p>
                <div className="mt-40 border-t border-black w-72 mx-auto text-center pt-2 font-bold uppercase">
                  {dados.razao || "Assinatura do Requerente"}
                </div>
              </div>
            )}

            {aba === 'print_procuracao' && (
              <div className="bg-white text-black p-12 leading-relaxed font-serif text-sm">
                <h1 className="text-center font-bold text-xl uppercase underline mb-12">PROCURAÇÃO</h1>
                <p className="text-justify mb-8">
                  <strong>OUTORGANTE:</strong> {dados.razao || "____________________"}, CNPJ nº {dados.cnpj || "____________________"}, 
                  com sede em {dados.endereco || "____________________"}.
                </p>
                <p className="text-justify mb-8">
                  <strong>OUTORGADO:</strong> {dados.tecnico || "____________________"}, portador do CREA/Registro {dados.creasql || "____________________"}.
                </p>
                <p className="text-justify mb-20 font-bold uppercase">
                  Poderes: Representar o outorgante perante os órgãos ambientais (SEMAS/SEMMA), protocolar processos, solicitar vistorias e assinar condicionantes.
                </p>
                <p className="text-center mt-20 italic">Belém, {new Date().toLocaleDateString('pt-BR')}</p>
                <div className="mt-32 border-t border-black w-64 mx-auto text-center pt-2 font-bold uppercase">
                  Outorgante
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTES AUXILIARES (UI) ---
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase tracking-tighter ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`}>
      {icon} {label}
    </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-green-500 transition font-bold text-slate-700"
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const isOk = status === 'OK';
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-2 ${
      isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isOk ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>} {status}
    </span>
  );
}

function DocPrintCard({ title, icon, onClick }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 text-center hover:shadow-xl hover:border-blue-500 transition cursor-pointer group" onClick={onClick}>
      <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">{icon}</div>
      <h4 className="font-black text-slate-800 uppercase italic text-sm">{title}</h4>
      <p className="text-[10px] text-slate-400 font-bold mt-2">Clique para Gerar e Imprimir PDF</p>
    </div>
  );
}
