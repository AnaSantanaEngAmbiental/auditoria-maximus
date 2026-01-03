import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Truck, FileText, ClipboardList, Camera, 
  Printer, Trash2, Plus, Download, CheckCircle2,
  User, Building2, MapPin, FileSignature
} from 'lucide-react';

export default function SilamMaximusV54() {
  const [aba, setAba] = useState('dashboard');
  const [dadosEmpresa, setDadosEmpresa] = useState({
    razaoSocial: '', cnpj: '', endereco: '', cidade: '', estado: 'PA', tecnico: '', cpfTecnico: ''
  });
  const [fotos, setFotos] = useState([]);
  const [itensAuditoria, setItensAuditoria] = useState([
    { id: 1, desc: 'Requerimento Padrão reconhecido', status: 'CONFORME' },
    { id: 2, desc: 'Plano de Gerenciamento de Resíduos', status: 'PENDENTE' }
  ]);

  // Função para Impressão de Documentos Específicos
  const imprimirDocumento = (tipo) => {
    setAba(tipo);
    setTimeout(() => {
      window.print();
      setAba('docs');
    }, 500);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 no-print">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
          <div className="bg-green-500 p-2 rounded-xl"><ShieldCheck size={24}/></div>
          <h1 className="text-xl font-black italic">MAXIMUS <span className="text-xs text-green-400">v5.4</span></h1>
        </div>

        <nav className="space-y-2">
          <MenuBtn icon={<User />} label="Dados do Cliente" active={aba === 'empresa'} onClick={() => setAba('empresa')} />
          <MenuBtn icon={<ClipboardList />} label="Checklist Técnico" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera />} label="Relatório de Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Gerador de Ofícios" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        
        {/* INTERFACE DE EDIÇÃO (NO-PRINT) */}
        <div className="no-print p-10 max-w-5xl mx-auto">
          
          {/* TELA DE DADOS DA EMPRESA */}
          {aba === 'empresa' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase italic">Configuração do Proponente</h2>
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Razão Social" value={dadosEmpresa.razaoSocial} onChange={(v) => setDadosEmpresa({...dadosEmpresa, razaoSocial: v})} />
                <InputGroup label="CNPJ" value={dadosEmpresa.cnpj} onChange={(v) => setDadosEmpresa({...dadosEmpresa, cnpj: v})} />
                <InputGroup label="Responsável Técnico" value={dadosEmpresa.tecnico} onChange={(v) => setDadosEmpresa({...dadosEmpresa, tecnico: v})} />
                <InputGroup label="CPF do Técnico" value={dadosEmpresa.cpfTecnico} onChange={(v) => setDadosEmpresa({...dadosEmpresa, cpfTecnico: v})} />
                <InputGroup label="Endereço Completo" value={dadosEmpresa.endereco} onChange={(v) => setDadosEmpresa({...dadosEmpresa, endereco: v})} />
              </div>
            </div>
          )}

          {/* GERADOR DE DOCUMENTOS */}
          {aba === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
              <DocCard 
                title="Ofício Requerimento" 
                desc="Gera o requerimento padrão para SEMMA/SEMAS-PA"
                onPrint={() => imprimirDocumento('print_oficio')}
              />
              <DocCard 
                title="Procuração Ambiental" 
                desc="Procuração para representação em processos"
                onPrint={() => imprimirDocumento('print_procuracao')}
              />
            </div>
          )}

          {/* RELATÓRIO FOTOGRÁFICO (MODO EDIÇÃO) */}
          {aba === 'fotos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border">
                <p className="text-xs font-black uppercase text-slate-400">Imagens da Vistoria</p>
                <input type="file" multiple onChange={(e) => {
                   const files = Array.from(e.target.files).map(f => ({ url: URL.createObjectURL(f), legenda: '' }));
                   setFotos([...fotos, ...files]);
                }} className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {fotos.map((f, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border">
                    <img src={f.url} className="h-40 w-full object-cover rounded-xl mb-2" />
                    <input 
                      placeholder="Legenda técnica..." 
                      className="w-full text-[10px] p-2 bg-slate-50 rounded-lg outline-none"
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
        </div>

        {/* --- ÁREA DE IMPRESSÃO (HIDDEN ON SCREEN, VISIBLE ON PRINT) --- */}
        <div className="print-only p-12 bg-white text-black font-serif">
          {/* MODELO DO OFÍCIO */}
          {aba === 'print_oficio' && (
            <div className="max-w-[800px] mx-auto leading-relaxed">
              <div className="text-center mb-12 border-b-2 border-black pb-4">
                <h1 className="font-bold text-xl uppercase">Ofício de Requerimento Ambiental</h1>
              </div>
              <p className="text-right mb-10">Belém/PA, {new Date().toLocaleDateString()}</p>
              <p className="mb-10 font-bold text-lg">À Secretaria Municipal de Meio Ambiente - SEMMA</p>
              <p className="mb-6 indent-12 text-justify">
                A empresa <strong>{dadosEmpresa.razaoSocial || "[RAZÃO SOCIAL]"}</strong>, inscrita no CNPJ sob nº <strong>{dadosEmpresa.cnpj || "[00.000.000/0001-00]"}</strong>, 
                situada no endereço {dadosEmpresa.endereco || "[ENDEREÇO COMPLETO]"}, vem respeitosamente à presença de Vossa Senhoria requerer a 
                <strong> LICENÇA DE OPERAÇÃO (LO)</strong> para a atividade licenciada conforme roteiro orientativo.
              </p>
              <p className="mb-20 indent-12 text-justify">
                Nestes termos, pede deferimento.
              </p>
              <div className="mt-20 text-center border-t border-black w-64 mx-auto pt-2">
                <p className="font-bold text-xs uppercase">{dadosEmpresa.razaoSocial || "Assinatura do Requerente"}</p>
                <p className="text-[10px]">Representante Legal</p>
              </div>
            </div>
          )}

          {/* MODELO DO RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && fotos.length > 0 && (
            <div className="p-4">
               <h2 className="text-center font-bold text-xl uppercase mb-10 border-b-4 border-slate-900 pb-4">Anexo: Relatório Fotográfico de Vistoria</h2>
               <div className="grid grid-cols-2 gap-10">
                 {fotos.map((f, i) => (
                   <div key={i} className="border p-2 break-inside-avoid">
                     <img src={f.url} className="w-full h-auto mb-2" />
                     <p className="text-sm font-bold text-center bg-slate-100 p-2 italic uppercase">Foto {i+1}: {f.legenda}</p>
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

// COMPONENTES DE INTERFACE
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition text-xs font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'text-slate-400 hover:bg-slate-800'
    }`}>
      {icon} {label}
    </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input 
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-green-500 transition font-bold"
      />
    </div>
  );
}

function DocCard({ title, desc, onPrint }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition group">
      <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition"><Printer /></div>
      <h4 className="font-black text-slate-800 uppercase italic mb-2">{title}</h4>
      <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">{desc}</p>
      <button onClick={onPrint} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-600 transition">
        <Printer size={16}/> Gerar e Imprimir
      </button>
    </div>
  );
}
