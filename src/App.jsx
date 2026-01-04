import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutGrid, Truck, FileCheck, Cpu, 
  Terminal, UploadCloud, Trash2, CheckCircle, AlertTriangle 
} from 'lucide-react';

// Configuração do Supabase (Mantendo suas credenciais originais)
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV61() {
  const [abaAtiva, setAbaAtiva] = useState('upload');
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([`> [${new Date().toLocaleTimeString()}] SISTEMA MAXIMUS V6.1 ONLINE.`]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    // 1. Busca evidências enviadas (Documentos)
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);

    // 2. Busca a frota de forma GENÉRICA do Banco de Dados
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    if (veiculos) setFrota(veiculos);
  }

  const addLog = (msg) => setLogs(prev => [`> [${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      addLog(`PROCESSANDO: ${nomeLimpo}...`);
      
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: nomeLimpo, url_publica: url.publicUrl, status: 'Aprovado', empresa_cnpj: '38.404.019/0001-76'
        }]);
        addLog(`SUCESSO: ${nomeLimpo} VINCULADO.`);
      }
    }
    carregarDados();
    setLoading(false);
  };

  const RenderFrota = () => {
    const hoje = new Date(); // Data atual para validar vencimentos (Janeiro 2026)
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-900 text-white font-black uppercase tracking-tighter">
            <tr>
              <th className="p-4 text-center">Status</th>
              <th className="p-4">Placa / Motorista</th>
              <th className="p-4">CIV / CIPP</th>
              <th className="p-4">MOPP</th>
              <th className="p-4">Evidência</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {frota.length === 0 ? (
              <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">Nenhum veículo encontrado no banco de dados.</td></tr>
            ) : frota.map((v, i) => {
              // Verifica se existe PDF no Storage com a placa do veículo
              const temPDF = arquivos.some(a => a.nome_arquivo.includes(v.placa.toLowerCase()));
              
              // Lógica de Vencimento Dinâmica
              const dataMopp = v.validade_mopp ? new Date(v.validade_mopp) : null;
              const estaVencido = dataMopp && dataMopp < hoje;

              return (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white ${estaVencido ? 'bg-red-500' : 'bg-green-600'}`}>
                      {estaVencido ? 'BLOQUEADO' : 'LIBERADO'}
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-800">
                    {v.placa} <br/>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{v.motorista || 'Sem motorista'}</span>
                  </td>
                  <td className="p-4 font-bold text-slate-600 italic">
                    {v.validade_civ || 'N/A'}
                  </td>
                  <td className="p-4 font-bold text-slate-600">
                    {v.validade_mopp || 'PENDENTE'}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black ${temPDF ? 'text-blue-600' : 'text-red-400'}`}>
                      {temPDF ? '✅ VINCULADO' : '⚠️ AGUARDANDO PDF'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-gradient-to-r from-[#064e3b] to-[#14532d] text-white px-6 h-16 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1.5 rounded-lg text-green-900"><ShieldCheck /></div>
          <div>
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-green-400">SiLAM-PA MAXIMUS v6.1</h1>
            <p className="text-[9px] font-bold opacity-70 tracking-widest uppercase">Auditoria Genérica de Conformidade</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => window.print()} className="bg-white text-green-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Imprimir Relatório</button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col space-y-2">
          <button onClick={() => setAbaAtiva('upload')} className={`flex items-center p-3 text-[11px] font-black rounded-xl ${abaAtiva === 'upload' ? 'bg-green-900 text-white' : 'hover:bg-slate-100'}`}><LayoutGrid className="mr-2 w-4 h-4"/> CENTRAL DE DADOS</button>
          <button onClick={() => setAbaAtiva('frota')} className={`flex items-center p-3 text-[11px] font-black rounded-xl ${abaAtiva === 'frota' ? 'bg-green-900 text-white' : 'hover:bg-slate-100'}`}><Truck className="mr-2 w-4 h-4"/> AUDITORIA DE FROTA ({frota.length})</button>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {abaAtiva === 'upload' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="bg-white p-10 rounded-[2rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-green-500 flex flex-col items-center cursor-pointer transition group text-center">
                <div className="bg-green-50 p-6 rounded-2xl text-green-600 group-hover:scale-110 transition"><UploadCloud size={40}/></div>
                <h3 className="mt-4 font-black uppercase text-sm">Ingestão de Evidências</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">PDF com placa do veículo no nome</p>
                <input type="file" multiple hidden onChange={handleUpload} />
              </label>
              <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-700">
                <h4 className="text-green-400 text-[10px] font-black uppercase mb-4 flex items-center"><Terminal className="mr-2 w-3 h-3"/> Console de Ingestão</h4>
                <div className="font-mono text-[10px] text-green-500 h-40 overflow-y-auto space-y-1">
                  {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'frota' && RenderFrota()}
        </main>
      </div>
    </div>
  );
}
