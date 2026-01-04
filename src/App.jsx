import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutGrid, Truck, FileCheck, Cpu, 
  Terminal, UploadCloud, Trash2, CheckCircle, AlertTriangle, Search
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SiLAM_Maximus_v6() {
  const [abaAtiva, setAbaAtiva] = useState('central');
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [logs, setLogs] = useState([`> [${new Date().toLocaleTimeString()}] SISTEMA MAXIMUS V6.1 INICIALIZADO.`]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    if (veiculos) setFrota(veiculos);
  }

  const RenderFrota = () => (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-slate-900 p-6 flex justify-between items-center">
        <h3 className="text-white font-black uppercase text-sm flex items-center">
          <Truck className="mr-2 text-green-400" /> Controle de Frota Atualizado
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase italic">Status em Tempo Real</span>
      </div>
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase">
          <tr>
            <th className="p-4 text-center">Status</th>
            <th className="p-4">Veículo / Placa</th>
            <th className="p-4">Motorista</th>
            <th className="p-4">Validade CIV/CIPP</th>
            <th className="p-4 text-center">Evidência PDF</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {frota.map((v, i) => {
            const temDoc = arquivos.some(a => a.nome_arquivo.toLowerCase().includes(v.placa.toLowerCase()));
            const vencido = v.validade_civ && new Date(v.validade_civ) < new Date();
            return (
              <tr key={i} className="hover:bg-green-50/50 transition-colors">
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white shadow-sm ${vencido ? 'bg-red-500' : 'bg-green-600'}`}>
                    {vencido ? 'BLOQUEADO' : 'LIBERADO'}
                  </span>
                </td>
                <td className="p-4 font-black text-slate-800">{v.placa}</td>
                <td className="p-4 font-bold text-slate-500 uppercase">{v.motorista || 'Não Informado'}</td>
                <td className="p-4 font-bold text-slate-600 italic">{v.validade_civ || 'Pendente'}</td>
                <td className="p-4 text-center font-black">
                  {temDoc ? <span className="text-blue-600 flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> VINCULADO</span> : <span className="text-slate-300">AGUARDANDO</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        .phd-gradient { background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #14532d 100%); }
        button { transition: all 0.2s ease-in-out; }
      `}</style>

      <header className="phd-gradient text-white px-8 h-20 flex justify-between items-center shadow-2xl border-b-4 border-green-400">
        <div className="flex items-center space-x-4">
          <div className="bg-white p-2 rounded-2xl shadow-lg"><ShieldCheck className="text-green-900" size={28} /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">SiLAM-PA Maximus v6.1</h1>
            <p className="text-[10px] font-bold text-green-300 tracking-[0.2em] uppercase mt-1">SISTEMA PH.D. DE CONFORMIDADE AMBIENTAL</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 p-8 space-y-3 flex flex-col shadow-inner">
          <button onClick={() => setAbaAtiva('central')} className={`flex items-center p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest ${abaAtiva === 'central' ? 'bg-green-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutGrid className="mr-3 w-5 h-5"/> Central de Dados
          </button>
          <button onClick={() => setAbaAtiva('frota')} className={`flex items-center p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest ${abaAtiva === 'frota' ? 'bg-green-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Truck className="mr-3 w-5 h-5"/> Auditoria de Frota
          </button>
          <div className="mt-auto bg-slate-900 p-5 rounded-3xl border border-slate-700 shadow-2xl">
            <h4 className="text-green-400 text-[10px] font-black uppercase mb-3 flex items-center tracking-tighter"><Terminal className="mr-2" size={12}/> Console Maximus</h4>
            <div className="font-mono text-[9px] text-green-500 h-32 overflow-y-auto space-y-1 opacity-80">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-12 overflow-y-auto">
          {abaAtiva === 'frota' ? <RenderFrota /> : (
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="bg-white p-16 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group shadow-sm">
                  <div className="bg-green-100 p-8 rounded-full text-green-600 group-hover:scale-110 group-hover:bg-green-200 transition-all shadow-md"><UploadCloud size={48} /></div>
                  <span className="mt-6 font-black uppercase text-slate-500 tracking-tighter">Ingestão de Evidências</span>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Arraste Laudos CIV/CIPP aqui</p>
                  <input type="file" multiple hidden />
                </label>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                  <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Resumo da Conformidade</h3>
                  <div className="space-y-4 text-[11px] font-bold">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl"><span>VEÍCULOS ATIVOS:</span> <span className="text-green-600">{frota.length}</span></div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl"><span>DOCS PENDENTES:</span> <span className="text-red-500">{frota.length - arquivos.filter(a => a.nome_arquivo.includes('CIV')).length}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
