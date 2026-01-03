import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutGrid, Truck, FileCheck, Cpu, 
  Map, ListChecks, Terminal, Printer, Lock, Search, 
  AlertTriangle, CheckCircle, FileText, UserPlus, Factory
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

// LISTA DE ATIVIDADES DO SEU ESCOPO
const ATIVIDADES_MAXIMUS = [
  { id: 'transp_perigoso', nome: 'Transporte de Prod. Perigosos', icone: <Truck /> },
  { id: 'posto_combustivel', nome: 'Posto de Combustíveis', icone: <Factory /> },
  { id: 'oficina_mecanica', nome: 'Oficinas e Concessionárias', icone: <Cpu /> },
  { id: 'industria_alimento', nome: 'Indústria de Alimentos', icone: <Factory /> },
  { id: 'construcao_civil', nome: 'Construção Civil', icone: <Map /> },
];

export default function SilamMaximusV51() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('central');
  const [empreendimento, setEmpreendimento] = useState(ATIVIDADES_MAXIMUS[0]);
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  
  // Estado para Frota (Parte do estudo do Roteiro de Transp. Perigosos)
  const [veiculos, setVeiculos] = useState([
    { placa: 'ABC-1234', tipo: 'BITREM', civ: '2025-05-10', cipp: '2024-12-20', antt: 'ATIVO', status: 'ALERTA' },
  ]);

  useEffect(() => {
    if (autorizado) buscarDados();
  }, [autorizado, empreendimento]);

  async function buscarDados() {
    const { data } = await supabase.from('auditoria_maximus').select('*');
    if (data) setItens(data);
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center">
          <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-700 animate-pulse">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">SiLAM-PA Maximus</h2>
          <p className="text-slate-500 text-[10px] font-bold mb-8 uppercase tracking-widest">Módulo de Engenharia Ph.D.</p>
          <input 
            type="password" 
            placeholder="Senha de Acesso"
            className="w-full p-4 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold focus:border-green-500 outline-none transition"
            onChange={(e) => setSenhaInput(e.target.value)}
          />
          <button 
            onClick={() => senhaInput === 'maximus2026' ? setAutorizado(true) : alert('Acesso Negado!')}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-2xl transition shadow-lg"
          >
            AUTENTICAR SISTEMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">
      {/* HEADER DINÂMICO */}
      <nav className="bg-white border-b sticky top-0 z-50 px-6 h-20 flex justify-between items-center no-print">
        <div className="flex items-center space-x-4">
          <div className="bg-green-700 p-2 rounded-xl text-white shadow-lg shadow-green-200"><ShieldCheck /></div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">MAXIMUS <span className="text-green-600 italic text-sm">v5.1</span></h1>
            <select 
              className="text-[10px] font-bold text-slate-500 uppercase bg-transparent outline-none cursor-pointer hover:text-green-600 transition"
              onChange={(e) => setEmpreendimento(ATIVIDADES_MAXIMUS.find(a => a.id === e.target.value))}
            >
              {ATIVIDADES_MAXIMUS.map(at => <option key={at.id} value={at.id}>{at.nome}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
           <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition border border-slate-200">
             <FileText size={14} /> Ofício Padrão
           </button>
           <button onClick={() => setAbaAtiva('relatorio')} className="bg-green-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">
             Gerar Dossiê Final
           </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR COM FOCO NO ROTEIRO */}
        <aside className="w-64 bg-white border-r flex flex-col p-6 space-y-2 no-print">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Auditoria e Gestão</p>
          <SidebarBtn icon={<LayoutGrid size={16}/>} label="PAINEL DE CONTROLE" active={abaAtiva === 'central'} onClick={() => setAbaAtiva('central')} />
          <SidebarBtn icon={<Truck size={16}/>} label="GESTÃO DE FROTA" active={abaAtiva === 'frota'} onClick={() => setAbaAtiva('frota')} />
          <div className="h-px bg-slate-100 my-4"></div>
          <SidebarBtn icon={<FileCheck size={16}/>} label="DOC. BÁSICA" active={abaAtiva === 'BÁSICA'} onClick={() => setAbaAtiva('BÁSICA')} />
          <SidebarBtn icon={<Cpu size={16}/>} label="DOC. TÉCNICA" active={abaAtiva === 'TÉCNICA'} onClick={() => setAbaAtiva('TÉCNICA')} />
          <SidebarBtn icon={<ListChecks size={16}/>} label="DIRETRIZES LO" active={abaAtiva === 'DIRETRIZ'} onClick={() => setAbaAtiva('DIRETRIZ')} />
        </aside>

        {/* ÁREA DE TRABALHO */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* MÓDULO DE FROTA (Exclusivo para Transporte e Logística) */}
          {abaAtiva === 'frota' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Controle de Frota - {empreendimento.nome}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verificação CIV / CIPP / ANTT</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  <UserPlus size={14} /> Adicionar Veículo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {veiculos.map((v, i) => (
                  <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-4">
                       <span className="bg-slate-800 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm">{v.placa}</span>
                       <StatusBadge status={v.status} />
                    </div>
                    <div className="space-y-2">
                      <DateCheck label="Validade CIV" date={v.civ} />
                      <DateCheck label="Validade CIPP" date={v.cipp} />
                      <div className="flex justify-between text-[9px] font-black uppercase pt-2 border-t">
                        <span className="text-slate-400">Extrato ANTT</span>
                        <span className="text-green-600">{v.antt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AS OUTRAS ABAS (BÁSICA, TÉCNICA, ETC) SEGUEM A MESMA LÓGICA ANTERIOR */}
          {['BÁSICA', 'TÉCNICA', 'DIRETRIZ'].includes(abaAtiva) && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-black uppercase text-slate-700 tracking-tighter">Checklist: {abaAtiva}</h3>
                  <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Roteiro: {empreendimento.nome}
                  </div>
               </div>
               {/* Tabela de itens aqui... */}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// COMPONENTES DE APOIO
function SidebarBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center p-3 text-[10px] font-black rounded-xl transition ${
      active ? 'bg-green-50 text-green-700 border border-green-200' : 'text-slate-500 hover:bg-slate-100'
    }`}>
      <span className="mr-3">{icon}</span> {label}
    </button>
  );
}

function DateCheck({ label, date }) {
  const isVencido = new Date(date) < new Date();
  return (
    <div className="flex justify-between items-center text-[10px] font-bold">
      <span className="text-slate-400 uppercase tracking-tighter">{label}</span>
      <span className={isVencido ? 'text-red-600' : 'text-slate-700'}>{new Date(date).toLocaleDateString()}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { ALERTA: 'bg-amber-100 text-amber-700', OK: 'bg-green-100 text-green-700', VENCIDO: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${colors[status]}`}>{status}</span>;
}
