import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutGrid, Truck, FileCheck, Cpu, 
  Map, ListChecks, Terminal, Printer, Lock, Search, AlertTriangle, CheckCircle 
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SilamMaximusV5() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('upload');
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [filtro, setFiltro] = useState('');
  const [logs, setLogs] = useState([{ hora: new Date().toLocaleTimeString(), msg: "SISTEMA MAXIMUS PRONTO. AGUARDANDO INGESTÃO..." }]);

  // Buscar dados do Supabase
  useEffect(() => {
    if (autorizado) buscarDados();
  }, [autorizado]);

  async function buscarDados() {
    const { data, error } = await supabase
      .from('auditoria_maximus')
      .select('*')
      .order('codigo', { ascending: true });
    
    if (data) setItens(data);
    if (error) console.error("Erro Supabase:", error);
  }

  // TELA DE ACESSO (LOGIN)
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center">
          <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-700">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">SiLAM-PA Maximus</h2>
          <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest">Acesso Restrito Ph.D.</p>
          <input 
            type="password" 
            placeholder="Senha de Acesso"
            className="w-full p-4 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold focus:border-green-500 outline-none transition"
            onChange={(e) => setSenhaInput(e.target.value)}
          />
          <button 
            onClick={() => senhaInput === 'maximus2026' ? setAutorizado(true) : alert('Acesso Negado!')}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-green-200"
          >
            AUTENTICAR SISTEMA
          </button>
        </div>
      </div>
    );
  }

  // Lógica de Filtro para as Abas
  const getItensPorAba = (categoria) => {
    return itens.filter(item => {
      // Normaliza categoria para bater com o banco (BÁSICA, TÉCNICA, etc)
      const catBanco = (item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const catBusca = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      
      const desc = (item['descricao de condicionante'] || item['descrição de condicionante'] || "").toLowerCase();
      return catBanco === catBusca && desc.includes(filtro.toLowerCase());
    }).sort((a, b) => Number(a.codigo) - Number(b.codigo));
  };

  const itensPendentes = itens.filter(i => i.status !== 'CONFORME');

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-gradient-to-r from-green-900 to-green-800 text-white sticky top-0 z-50 shadow-2xl px-6 h-16 flex justify-between items-center no-print">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1.5 rounded-lg text-green-900 shadow-inner"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-green-400">SiLAM-PA MAXIMUS</h1>
            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Auditoria Ambiental v5.0</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setAbaAtiva('relatorio')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition"
          >
            Gerar Relatório
          </button>
          <button onClick={() => window.print()} className="bg-white text-green-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">
            Exportar Dossiê
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r shadow-xl flex flex-col z-40 no-print">
          <div className="p-6 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Módulos</p>
            
            <SidebarItem icon={<LayoutGrid size={16}/>} label="CENTRAL DE DADOS" active={abaAtiva === 'upload'} onClick={() => setAbaAtiva('upload')} />
            <SidebarItem icon={<Truck size={16}/>} label="FROTA (LOGÍSTICA)" active={abaAtiva === 'frota'} onClick={() => setAbaAtiva('frota')} />
            
            <div className="h-px bg-slate-100 my-4"></div>
            
            <SidebarItem icon={<FileCheck size={16}/>} label="1. DOC. BÁSICA" active={abaAtiva === 'BÁSICA'} onClick={() => setAbaAtiva('BÁSICA')} />
            <SidebarItem icon={<Cpu size={16}/>} label="2. DOC. TÉCNICA" active={abaAtiva === 'TÉCNICA'} onClick={() => setAbaAtiva('TÉCNICA')} />
            <SidebarItem icon={<Map size={16}/>} label="3. PROJETOS" active={abaAtiva === 'PROJETO'} onClick={() => setAbaAtiva('PROJETO')} />
            <SidebarItem icon={<ListChecks size={16}/>} label="4. DIRETRIZES" active={abaAtiva === 'DIRETRIZ'} onClick={() => setAbaAtiva('DIRETRIZ')} />
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f9fafb]">
          
          {/* PÁGINA CENTRAL DE DADOS */}
          {abaAtiva === 'upload' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-green-500 transition cursor-pointer text-center group">
                  <div className="bg-green-50 p-6 rounded-3xl text-green-600 mb-6 inline-block group-hover:scale-110 transition"><ShieldCheck size={48} /></div>
                  <h3 className="font-black uppercase text-sm">Monitoramento Ativo</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 italic">DADOS SINCRONIZADOS COM SUPABASE</p>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-blue-500 transition cursor-pointer text-center group">
                  <div className="bg-blue-50 p-6 rounded-3xl text-blue-600 mb-6 inline-block group-hover:scale-110 transition"><Terminal size={48} /></div>
                  <h3 className="font-black uppercase text-sm">Base de Normas</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 italic">INTEGRIDADE DE DADOS GARANTIDA</p>
                </div>
              </div>

              <div className="bg-[#1e293b] p-6 rounded-3xl shadow-2xl">
                <h4 className="text-white text-[10px] font-black uppercase mb-4 tracking-widest flex items-center">
                   <Terminal className="w-4 h-4 mr-2 text-green-400" /> Console de Operação Maximus
                </h4>
                <div className="text-green-400 font-mono text-[10px] space-y-1 h-40 overflow-y-auto p-2">
                  {logs.map((log, i) => (
                    <div key={i}>{`> [${log.hora}] ${log.msg}`}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PÁGINAS DE TABELAS DINÂMICAS */}
          {['BÁSICA', 'TÉCNICA', 'PROJETO', 'DIRETRIZ'].includes(abaAtiva) && (
            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <h2 className="font-black text-lg text-slate-800 uppercase tracking-tighter italic border-l-4 border-green-600 pl-3">
                  Módulo: {abaAtiva}
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar condicionante..." 
                    className="pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-green-500"
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Descrição Técnica</th>
                    <th className="p-4 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getItensPorAba(abaAtiva).map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition">
                      <td className="p-4 font-bold text-slate-400 text-xs">{item.codigo}</td>
                      <td className="p-4 text-xs font-bold text-slate-700 uppercase leading-relaxed text-justify">{item['descricao de condicionante'] || item['descrição de condicionante']}</td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PÁGINA DE RELATÓRIO (PRINT VIEW) */}
          {abaAtiva === 'relatorio' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-4xl mx-auto border border-slate-200 shadow-blue-100">
              <div className="flex justify-between items-center border-b-8 border-green-900 pb-8 mb-10 text-green-900">
                <div className="font-black text-3xl">MAXIMUS <span className="text-blue-600">v5.0</span></div>
                <div className="text-right">
                  <p className="text-[9px] font-black opacity-50 uppercase">Data da Auditoria</p>
                  <p className="font-black">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-10">
                <StatCard label="Total Analisado" value={itens.length} />
                <StatCard label="Em Conformidade" value={itens.length - itensPendentes.length} color="text-green-600" />
                <StatCard label="Inconformidades" value={itensPendentes.length} color="text-red-600" />
              </div>

              <h3 className="text-xs font-black uppercase mb-4 text-slate-500 tracking-widest border-b pb-2">Itens com Pendência Crítica</h3>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase">
                    <th className="p-2 text-left">Ref</th>
                    <th className="p-2 text-left">Descrição da Inconformidade</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPendentes.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2 font-black">{item.codigo}</td>
                      <td className="p-2 uppercase font-medium">{item['descricao de condicionante'] || item['descrição de condicionante']}</td>
                      <td className="p-2 text-center font-black text-red-600">INCONFORME</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES (UI)
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-3 text-[11px] font-black rounded-xl transition mb-1 ${
        active ? 'bg-green-900 text-white border-r-4 border-green-400 shadow-lg' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const isOk = status === 'CONFORME';
  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 w-fit ${
      isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isOk ? <CheckCircle size={10}/> : <AlertTriangle size={10}/>}
      {status || 'PENDENTE'}
    </span>
  );
}

function StatCard({ label, value, color = "text-slate-800" }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
