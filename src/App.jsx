import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, LayoutGrid, Truck, Terminal, UploadCloud, Trash2 } from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV61() {
  const [abaAtiva, setAbaAtiva] = useState('upload');
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [logs, setLogs] = useState([`> [${new Date().toLocaleTimeString()}] SISTEMA ONLINE.`]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*');
    if (docs) setArquivos(docs);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    if (veiculos) setFrota(veiculos);
  }

  const RenderFrota = () => (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden m-4">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-900 text-white font-black uppercase">
          <tr>
            <th className="p-4">STATUS</th>
            <th className="p-4">PLACA</th>
            <th className="p-4">MOTORISTA</th>
            <th className="p-4">CIV / CIPP</th>
            <th className="p-4">MOPP</th>
            <th className="p-4 text-center">EVIDÊNCIA</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {frota.map((v, i) => {
            const temDoc = arquivos.some(a => a.nome_arquivo.includes(v.placa.toLowerCase()));
            const vencido = (v.validade_civ && new Date(v.validade_civ) < new Date());
            return (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white ${vencido ? 'bg-red-500' : 'bg-green-600'}`}>
                    {vencido ? 'BLOQUEADO' : 'LIBERADO'}
                  </span>
                </td>
                <td className="p-4 font-black">{v.placa}</td>
                <td className="p-4 font-bold text-slate-500 uppercase">{v.motorista}</td>
                <td className="p-4 text-slate-600">{v.validade_civ || 'N/A'}</td>
                <td className="p-4 text-slate-600">{v.validade_mopp || 'PENDENTE'}</td>
                <td className="p-4 text-center font-black text-blue-600">{temDoc ? '✅ OK' : '❌ PENDENTE'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Script para forçar carregamento do Tailwind */}
      <script src="https://cdn.tailwindcss.com"></script>
      
      <header className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="text-green-400" />
          <h1 className="font-black uppercase text-sm tracking-tighter">SiLAM-PA Maximus v6.1</h1>
        </div>
        <button onClick={() => window.print()} className="bg-white text-green-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase">Imprimir Relatório</button>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r p-6 space-y-2 shadow-inner">
          <button onClick={() => setAbaAtiva('upload')} className={`w-full text-left p-3 rounded-xl text-[11px] font-black transition ${abaAtiva === 'upload' ? 'bg-green-900 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}>
            <LayoutGrid className="inline mr-2 w-4 h-4"/> CENTRAL DE DADOS
          </button>
          <button onClick={() => setAbaAtiva('frota')} className={`w-full text-left p-3 rounded-xl text-[11px] font-black transition ${abaAtiva === 'frota' ? 'bg-green-900 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}>
            <Truck className="inline mr-2 w-4 h-4"/> AUDITORIA DE FROTA ({frota.length})
          </button>
        </aside>

        <main className="flex-1 p-8">
          {abaAtiva === 'frota' ? RenderFrota() : (
            <div className="grid grid-cols-2 gap-6">
              <label className="bg-white p-12 rounded-[2rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition group">
                <UploadCloud size={48} className="text-slate-300 group-hover:text-green-500 transition"/>
                <span className="mt-4 font-black uppercase text-slate-400 group-hover:text-green-900">Arraste os Documentos</span>
                <input type="file" multiple hidden />
              </label>
              <div className="bg-slate-900 p-6 rounded-[2rem] h-64 overflow-y-auto shadow-2xl">
                <h4 className="text-green-400 text-[10px] font-black uppercase mb-4 flex items-center"><Terminal className="mr-2 w-3 h-3"/> Console Ph.D. Maximus</h4>
                <div className="font-mono text-[10px] text-green-500 space-y-1">
                  {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
