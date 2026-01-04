import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, LayoutGrid, Truck, FileCheck, Cpu, Terminal, 
  UploadCloud, Trash2, CheckCircle, AlertTriangle, Printer 
} from 'lucide-react';

// Configuração mantida conforme seu código original
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DB_BASICA = ["Requerimento Padrão SEMMA", "Ficha Cadastral", "DIA", "CNPJ", "Inscrição Estadual", "Contrato Social", "RG/CPF Proprietário", "Comprovante Endereço", "Alvará Prefeitura", "Bombeiros", "Uso do Solo", "Polícia Civil", "Contrato Aluguel", "Procuração", "Planta/ART", "Vigilância Sanitária", "Alvará Construção", "CND Municipal", "CTAM", "Outorga SEMAS", "CAR", "Publicação DO"];
const DB_TECNICA = ["Análise Água", "Efluentes", "BTEX/PAH", "ART Veterinário", "CIV/CIPP", "MOPP", "Frota ANTT"];

export default function MaximusV61() {
  const [abaAtiva, setAbaAtiva] = useState('upload');
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]); // Agora vem do banco!
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([`> [${new Date().toLocaleTimeString()}] SISTEMA MAXIMUS V6.1 ONLINE.`]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    // Busca arquivos (evidências)
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);

    // Busca frota cadastrada (Genérico para qualquer cliente)
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

  // Lógica Genérica de Auditoria de Frota
  const RenderFrota = () => {
    const hoje = new Date();
    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-900 text-white font-black uppercase">
            <tr>
              <th className="p-4">Veículo/Placa</th>
              <th className="p-4">CIV/CIPP</th>
              <th className="p-4">MOPP</th>
              <th className="p-4">ANTT</th>
              <th className="p-4">Evidência PDF</th>
              <th className="p-4 text-center">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {frota.length === 0 ? (
              <tr><td colSpan="6" className="p-10 text-center font-bold text-slate-400">NENHUM VEÍCULO CADASTRADO PARA ESTE EMPREENDIMENTO.</td></tr>
            ) : frota.map((v, i) => {
              const temPDF = arquivos.some(a => a.nome_arquivo.includes(v.placa.toLowerCase()));
              const vMopp = new Date(v.validade_mopp);
              const estaVencido = vMopp < hoje || v.status_antt !== 'ATIVO';

              return (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-black text-blue-900">{v.placa}<br/><span className="text-[9px] text-slate-400">{v.motorista}</span></td>
                  <td className="p-4 font-bold">{v.validade_civ}</td>
                  <td className="p-4 font-bold">{v.validade_mopp}</td>
                  <td className="p-4 font-bold">{v.status_antt}</td>
                  <td className="p-4 font-black">{temPDF ? '✅ VINCULADO' : '❌ PENDENTE'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${estaVencido ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>
                      {estaVencido ? 'BLOQUEADO' : 'LIBERADO'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const RenderTabela = (lista, prefixo) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase">
          <tr>
            <th className="p-4 w-20">REF</th>
            <th className="p-4">DESCRIÇÃO DA CONDICIONANTE</th>
            <th className="p-4">STATUS</th>
            <th className="p-4">EVIDÊNCIA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lista.map((item, i) => {
            const match = arquivos.find(a => a.nome_arquivo.includes(item.toLowerCase().split(' ')[0]));
            return (
              <tr key={i} className="hover:bg-green-50/50 transition">
                <td className="p-4 font-bold text-slate-400">{prefixo}{i+1}</td>
                <td className="p-4 font-black text-slate-800 uppercase">{item}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black ${match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {match ? 'CONFORME' : 'PENDENTE'}
                  </span>
                </td>
                <td className="p-4 text-blue-600 font-bold">{match ? match.nome_arquivo : '--'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-r from-[#064e3b] to-[#14532d] text-white px-6 h-16 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="text-green-400" />
          <h1 className="text-sm font-black uppercase tracking-tighter">SiLAM-PA MAXIMUS v6.1</h1>
        </div>
        <button onClick={() => window.print()} className="bg-white text-green-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Imprimir Dossiê</button>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r p-6 space-y-2">
          <button onClick={() => setAbaAtiva('upload')} className={`w-full flex p-3 rounded-xl text-[11px] font-black ${abaAtiva === 'upload' ? 'bg-green-900 text-white' : ''}`}><LayoutGrid className="mr-2 w-4 h-4"/> CENTRAL DE DADOS</button>
          <button onClick={() => setAbaAtiva('frota')} className={`w-full flex p-3 rounded-xl text-[11px] font-black ${abaAtiva === 'frota' ? 'bg-green-900 text-white' : ''}`}><Truck className="mr-2 w-4 h-4"/> AUDITORIA DE FROTA ({frota.length})</button>
          <button onClick={() => setAbaAtiva('basica')} className={`w-full flex p-3 rounded-xl text-[11px] font-black ${abaAtiva === 'basica' ? 'bg-green-900 text-white' : ''}`}><FileCheck className="mr-2 w-4 h-4"/> DOC. BÁSICA</button>
          <button onClick={() => setAbaAtiva('tecnica')} className={`w-full flex p-3 rounded-xl text-[11px] font-black ${abaAtiva === 'tecnica' ? 'bg-green-900 text-white' : ''}`}><Cpu className="mr-2 w-4 h-4"/> DOC. TÉCNICA</button>
        </aside>

        <main className="flex-1 p-8">
          {abaAtiva === 'upload' && (
            <div className="grid grid-cols-2 gap-6">
               <label className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center cursor-pointer">
                  <UploadCloud size={40} className="text-green-600"/>
                  <span className="mt-4 font-black uppercase text-xs">Arraste os Documentos</span>
                  <input type="file" multiple hidden onChange={handleUpload} />
               </label>
               <div className="bg-slate-900 p-6 rounded-3xl h-48 overflow-y-auto font-mono text-[10px] text-green-500">
                  {logs.map((log, i) => <div key={i}>{log}</div>)}
               </div>
            </div>
          )}

          {abaAtiva === 'frota' && RenderFrota()}
          {abaAtiva === 'basica' && RenderTabela(DB_BASICA, "B")}
          {abaAtiva === 'tecnica' && RenderTabela(DB_TECNICA, "T")}
        </main>
      </div>
    </div>
  );
}
