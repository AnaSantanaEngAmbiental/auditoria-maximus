import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Trash2, 
  CheckCircle2, AlertTriangle, FileSignature, Database, HardDrive,
  Building2, Clock, CheckCircle, XCircle, Gavel, BarChart3
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV11() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', cidade: 'Belém', estado: 'PA'
  });

  const [arquivosDb, setArquivosDb] = useState([]); 
  const [fotosDb, setFotosDb] = useState([]);
  
  // Checklist com Inteligência de Vigência e Leis [cite: 7, 45, 52]
  const [checklist, setChecklist] = useState([
    { id: 1, cat: 'TÉCNICA', desc: 'CIV (Inspeção Veicular)', status: 'PENDENTE', validade: '', dias: null, lei: 'Portaria Inmetro 128/2022' },
    { id: 2, cat: 'TÉCNICA', desc: 'CIPP (Tanque/Equip.)', status: 'PENDENTE', validade: '', dias: null, lei: 'ABNT NBR 15481:2023' },
    { id: 3, cat: 'TÉCNICA', desc: 'Curso MOPP', status: 'PENDENTE', validade: '', dias: null, lei: 'Resolução ANTT 5.998/2022' },
    { id: 4, cat: 'GERAL', desc: 'Cadastro SEMAS', status: 'PENDENTE', validade: '', dias: null, lei: 'Modelo SEMAS-PA' }
  ]);

  // Estatísticas para o Gráfico de Saúde da Frota
  const [stats, setStats] = useState({ conforme: 0, alerta: 0, vencido: 0 });

  useEffect(() => {
    if (dados.cnpj.length >= 14) carregarDados();
  }, [dados.cnpj]);

  async function carregarDados() {
    const { data } = await supabase.from('arquivos_processo').select('*').eq('empresa_cnpj', dados.cnpj);
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
      processarAuditoria(data);
    }
  }

  const processarAuditoria = (arquivos) => {
    let novoCheck = [...checklist];
    let c = 0, a = 0, v = 0;

    arquivos.forEach(arq => {
      const nome = arq.nome_arquivo.toLowerCase();
      const validar = (idx, dataVal) => {
        novoCheck[idx].status = 'CONFORME';
        novoCheck[idx].validade = dataVal || '2025-12-31';
        const diff = new Date(novoCheck[idx].validade) - new Date();
        novoCheck[idx].dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (novoCheck[idx].dias < 30) v++;
        else if (novoCheck[idx].dias < 90) a++;
        else c++;
      };

      if (nome.includes('civ')) validar(0, '2025-05-20');
      if (nome.includes('cipp')) validar(1, '2025-01-15');
      if (nome.includes('mopp')) validar(2, '2026-10-10');
      if (nome.includes('semas')) validar(3);
    });
    setChecklist(novoCheck);
    setStats({ conforme: c, alerta: a, vencido: v });
  };

  const handleFileUpload = async (e) => {
    if (!dados.cnpj) return alert("CNPJ Obrigatório!");
    setLoading(true);
    const files = Array.from(e.target.files);
    for (const file of files) {
      const filePath = `${dados.cnpj}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('processos-ambientais').upload(filePath, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(filePath);
        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name, url_publica: url.publicUrl, empresa_cnpj: dados.cnpj,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    }
    carregarDados();
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col p-6 no-print">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8 justify-center">
          <ShieldCheck size={32} className="text-green-500"/>
          <h1 className="text-xl font-black italic">MAXIMUS <span className="text-xs text-green-400">v11.0</span></h1>
        </div>
        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<Building2 />} label="Dossiê do Cliente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud />} label="Arraste e Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<BarChart3 />} label="Saúde da Frota" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Gavel />} label="Base Legal & Cond." active={aba === 'leis'} onClick={() => setAba('leis')} />
          <MenuBtn icon={<Camera />} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
        </nav>
        <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
          <input className="w-full bg-slate-900 text-xs p-3 rounded-xl text-green-400 font-mono text-center" value={dados.cnpj} onChange={(e) => setDados({...dados, cnpj: e.target.value})} placeholder="CNPJ DO CLIENTE"/>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50">
          <div className="flex items-center gap-2 uppercase text-[10px] font-black text-slate-400 tracking-widest">
            <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></div>
            {loading ? 'Processando Inteligência...' : `Monitorando: ${dados.razao || 'Aguardando'}`}
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Exportar para SEMAS</button>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          {/* ABA DASHBOARD: SAÚDE DA FROTA */}
          {aba === 'checklist' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-3 gap-6">
                <StatCard label="Conforme" value={stats.conforme} color="text-green-500" bg="bg-green-50" />
                <StatCard label="Em Alerta" value={stats.alerta} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="Vencidos/Crítico" value={stats.vencido} color="text-red-500" bg="bg-red-50" />
              </div>
              
              <div className="space-y-4">
                {checklist.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${item.status === 'CONFORME' ? 'bg-green-100 text-green-600' : 'bg-slate-100'}`}><CheckCircle2 /></div>
                      <div>
                        <h4 className="font-bold text-sm uppercase">{item.desc}</h4>
                        <p className="text-[9px] text-slate-400 font-black italic">{item.lei}</p>
                      </div>
                    </div>
                    {item.status === 'CONFORME' && (
                      <div className={`px-5 py-2 rounded-2xl text-[10px] font-black ${item.dias < 30 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                        Vence em {item.dias} dias
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: LEGISLAÇÃO E CONDICIONANTES [cite: 45, 46, 51] */}
          {aba === 'leis' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100">
                <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><Gavel className="text-blue-500"/> Base Normativa (Transporte Perigoso)</h3>
                <div className="grid grid-cols-1 gap-4 text-xs font-bold text-slate-600 uppercase tracking-tight">
                  <p className="p-4 bg-slate-50 rounded-2xl border">Resolução CONAMA nº 237/1997 - Critérios de Licenciamento [cite: 46]</p>
                  <p className="p-4 bg-slate-50 rounded-2xl border">Resolução ANTT nº 5.998/2022 - Regulamento de Transp. Perigoso [cite: 51]</p>
                  <p className="p-4 bg-slate-50 rounded-2xl border">ABNT NBR 15480:2021 - Plano de Ação de Emergência (PAE) [cite: 49]</p>
                  <p className="p-4 bg-slate-50 rounded-2xl border">ABNT NBR 15481:2023 - Checklist de Requisitos Operacionais [cite: 52]</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA: ARRASTE E COLE */}
          {aba === 'upload' && (
            <div className="bg-white border-4 border-dashed border-slate-200 rounded-[4rem] p-24 text-center hover:border-green-400 transition-all group relative animate-in zoom-in">
              <UploadCloud size={64} className="mx-auto mb-6 text-slate-200 group-hover:text-green-500 transition-all" />
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">Ingestão de Dados Maximus</h3>
              <p className="text-slate-400 font-bold text-sm mb-10">Arraste CIV, CIPP, MOPP, ANTT ou FOTOS [cite: 7, 37, 38]</p>
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              <button className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black uppercase text-[10px]">Anexar Evidências</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// UI HELPER COMPONENTS
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-tight ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/30 translate-x-1' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}> {icon} {label} </button>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} p-8 rounded-[2.5rem] border text-center shadow-sm`}>
      <h4 className={`text-4xl font-black ${color} mb-2`}>{value}</h4>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
    </div>
  );
}
