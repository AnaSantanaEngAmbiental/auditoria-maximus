import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, Truck, FileText, ClipboardList, Settings, 
  AlertCircle, CheckCircle2, Printer, Plus, Search, 
  MapPin, User, Building2, Calendar
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

// LISTA DE ROTEIROS BASEADOS NO SEU PEDIDO
const ROTEIROS = [
  { id: 'transp_perigoso', nome: 'Transporte de Prod. Perigosos', cor: 'blue' },
  { id: 'posto_combustivel', nome: 'Posto de Combustíveis', cor: 'green' },
  { id: 'oficina', nome: 'Oficina Mecânica / Concessionária', cor: 'amber' },
  { id: 'industria', nome: 'Indústria / Fábricas', cor: 'purple' },
  { id: 'const_civil', nome: 'Construção Civil', cor: 'slate' }
];

export default function SilamMaximusV52() {
  const [aba, setAba] = useState('dashboard');
  const [roteiroAtivo, setRoteiroAtivo] = useState(ROTEIROS[0]);
  const [dadosEmpresa, setDadosEmpresa] = useState({ nome: '', cnpj: '', responsavel: '', cidade: 'Belém/PA' });
  const [checklist, setChecklist] = useState([]);
  const [frota, setFrota] = useState([
    { placa: 'QDB-0000', civ: '2024-12-01', cipp: '2025-01-15', mopp: 'SIM', antt: 'CONFORME' }
  ]);

  // Carregar dados conforme o roteiro
  useEffect(() => {
    async function carregarChecklist() {
      const { data } = await supabase.from('auditoria_maximus').select('*');
      if (data) setChecklist(data);
    }
    carregarChecklist();
  }, [roteiroAtivo]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* SIDEBAR DESIGN PREMIUM */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-6">
          <div className="bg-green-500 p-2 rounded-xl shadow-lg shadow-green-900/20"><ShieldCheck size={28}/></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter italic">MAXIMUS</h1>
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em]">SISTEMA DE ENGENHARIA</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<Settings size={18}/>} label="Dashboard Principal" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<User size={18}/>} label="Dados do Proponente" active={aba === 'empresa'} onClick={() => setAba('empresa')} />
          <MenuBtn icon={<ClipboardList size={18}/>} label="Checklist de Auditoria" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          {roteiroAtivo.id === 'transp_perigoso' && (
            <MenuBtn icon={<Truck size={18}/>} label="Gestão de Frota" active={aba === 'frota'} onClick={() => setAba('frota')} />
          )}
        </nav>

        <div className="mt-auto bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 text-center">Roteiro Atual</p>
          <select 
            className="w-full bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-600 outline-none"
            onChange={(e) => setRoteiroAtivo(ROTEIROS.find(r => r.id === e.target.value))}
          >
            {ROTEIROS.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 py-4 border-b flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{roteiroAtivo.nome}</h2>
          <div className="flex gap-3">
             <button className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition"><Printer size={20}/></button>
             <button className="bg-green-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-green-200 hover:scale-105 transition">Exportar Relatório</button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* ABA DASHBOARD */}
          {aba === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard title="Total de Exigências" value={checklist.length} color="blue" />
               <StatCard title="Conformidade" value="65%" color="green" />
               <StatCard title="Pendências Críticas" value="12" color="red" />
            </div>
          )}

          {/* ABA EMPRESA (PREENCHIMENTO DE DOCUMENTOS) */}
          {aba === 'empresa' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-300">
               <div className="mb-8">
                 <h3 className="text-xl font-black text-slate-800 italic">Informações do Requerente</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase">Esses dados preencherão o Ofício e a Procuração automaticamente</p>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="Razão Social / Nome" placeholder="Nome Completo" value={dadosEmpresa.nome} onChange={(val) => setDadosEmpresa({...dadosEmpresa, nome: val})} />
                  <InputGroup label="CNPJ / CPF" placeholder="00.000.000/0001-00" value={dadosEmpresa.cnpj} onChange={(val) => setDadosEmpresa({...dadosEmpresa, cnpj: val})} />
                  <InputGroup label="Responsável Técnico" placeholder="Engenheiro Responsável" value={dadosEmpresa.responsavel} onChange={(val) => setDadosEmpresa({...dadosEmpresa, responsavel: val})} />
                  <InputGroup label="Cidade/Estado" placeholder="Ex: Belém/PA" value={dadosEmpresa.cidade} onChange={(val) => setDadosEmpresa({...dadosEmpresa, cidade: val})} />
               </div>
               <div className="mt-10 flex gap-4">
                  <button className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-blue-100">
                    <FileText size={16}/> Gerar Ofício Requerimento
                  </button>
                  <button className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-indigo-100">
                    <User size={16}/> Gerar Procuração Padrão
                  </button>
               </div>
            </div>
          )}

          {/* ABA FROTA (EXCLUSIVA PRO ROTEIRO DE TRANSPORTE) */}
          {aba === 'frota' && (
            <div className="space-y-6">
               <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center gap-4">
                  <AlertCircle className="text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">Atenção: 2 veículos com CIV/CIPP vencendo em menos de 30 dias conforme exigência da SEMAS.</p>
               </div>
               <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-[10px] font-black text-slate-400 uppercase">
                        <th className="p-4 text-center">Placa</th>
                        <th className="p-4">Validade CIV</th>
                        <th className="p-4">Validade CIPP</th>
                        <th className="p-4">Extrato ANTT</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold text-slate-700">
                      {frota.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 text-center"><span className="bg-slate-800 text-white px-3 py-1 rounded-lg font-mono">{v.placa}</span></td>
                          <td className="p-4 text-red-600 italic">{new Date(v.civ).toLocaleDateString()}</td>
                          <td className="p-4 text-green-600">{new Date(v.cipp).toLocaleDateString()}</td>
                          <td className="p-4 text-slate-400">{v.antt}</td>
                          <td className="p-4 flex justify-center"><CheckCircle2 className="text-green-500" size={18}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition text-xs font-black uppercase tracking-tighter ${
      active ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, color }) {
  const colors = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600' };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{title}</p>
      <p className={`text-3xl font-black ${colors[color]}`}>{value}</p>
    </div>
  );
}

function InputGroup({ label, placeholder, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-green-500 transition font-bold text-slate-700"
      />
    </div>
  );
}
