import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Trash2, 
  CheckCircle2, AlertTriangle, FileSignature, Database, HardDrive,
  User, Building2, Calendar, Clock, CheckCircle, XCircle
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV10() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém', estado: 'PA'
  });

  const [arquivosDb, setArquivosDb] = useState([]); 
  const [fotosDb, setFotosDb] = useState([]);
  
  // Checklist com Inteligência de Datas e Vigência
  const [checklist, setChecklist] = useState([
    { id: 1, cat: 'TÉCNICA', desc: 'Certificado CIV (Inspeção Veicular)', status: 'PENDENTE', validade: '', diasRestantes: null },
    { id: 2, cat: 'TÉCNICA', desc: 'Certificado CIPP (Tanque/Equip.)', status: 'PENDENTE', validade: '', diasRestantes: null },
    { id: 3, cat: 'TÉCNICA', desc: 'Curso MOPP (Motorista)', status: 'PENDENTE', validade: '', diasRestantes: null },
    { id: 4, cat: 'TÉCNICA', desc: 'Extrato ANTT (Frota)', status: 'PENDENTE', validade: '', diasRestantes: null },
    { id: 5, cat: 'BÁSICA', desc: 'Cadastro Modelo SEMAS', status: 'PENDENTE', validade: '', diasRestantes: null }
  ]);

  useEffect(() => {
    if (dados.cnpj.length >= 14) carregarDadosEmpresa();
  }, [dados.cnpj]);

  async function carregarDadosEmpresa() {
    const { data } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj);
    
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
      processarChecklistComVigencia(data);
    }
  }

  // --- CALCULADORA DE VIGÊNCIA AMBIENTAL ---
  const calcularVigencia = (dataValidade) => {
    if (!dataValidade) return null;
    const hoje = new Date();
    const vencimento = new Date(dataValidade);
    const diffTime = vencimento - hoje;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const processarChecklistComVigencia = (arquivos) => {
    let novoChecklist = [...checklist];
    arquivos.forEach(arq => {
      const nome = arq.nome_arquivo.toLowerCase();
      
      const atualizarItem = (index, dataVal) => {
        novoChecklist[index].status = 'CONFORME';
        novoChecklist[index].validade = dataVal || '2025-12-31'; // Data exemplo se não vier no arquivo
        novoChecklist[index].diasRestantes = calcularVigencia(novoChecklist[index].validade);
      };

      if (nome.includes('civ')) atualizarItem(0, arq.data_vencimento);
      if (nome.includes('cipp')) atualizarItem(1, arq.data_vencimento);
      if (nome.includes('mopp')) atualizarItem(2, arq.data_vencimento);
      if (nome.includes('antt')) atualizarItem(3, null);
      if (nome.includes('semas')) atualizarItem(4, null);
    });
    setChecklist(novoChecklist);
  };

  const handleFileUpload = async (e) => {
    if (!dados.cnpj) return alert("CNPJ Obrigatório!");
    setLoading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${dados.cnpj}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('processos-ambientais')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(filePath);
        await supabase.from('arquivos_processo').insert([{
          nome_arquivo: file.name,
          tipo_arquivo: file.name.split('.').pop(),
          url_publica: urlData.publicUrl,
          empresa_cnpj: dados.cnpj,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    }
    carregarDadosEmpresa();
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8 justify-center">
          <div className="bg-green-500 p-2 rounded-xl"><ShieldCheck size={24}/></div>
          <h1 className="text-xl font-black italic tracking-tighter">MAXIMUS <span className="text-[10px] text-green-400">v10.0</span></h1>
        </div>

        <nav className="space-y-1 flex-1">
          <MenuBtn icon={<Building2 />} label="Proponente" active={aba === 'dashboard'} onClick={() => setAba('dashboard')} />
          <MenuBtn icon={<UploadCloud />} label="Arraste e Cole" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Clock />} label="Controle de Vigência" active={aba === 'checklist'} onClick={() => setAba('checklist')} />
          <MenuBtn icon={<Camera />} label="Relatório Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Documentos" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">CNPJ em Análise</p>
          <input className="w-full bg-slate-900 text-xs p-2 rounded-lg text-white font-mono" value={dados.cnpj} onChange={(e) => setDados({...dados, cnpj: e.target.value})} placeholder="00000000000000"/>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b flex justify-between items-center px-10 sticky top-0 z-50 no-print">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestão Ambiental Inteligente</h2>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full">SEMAS/PA - Protocolo Digital</span>
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          
          {/* ABA: VIGÊNCIA (CHECKLIST INTELIGENTE) */}
          {aba === 'checklist' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Status de Vigência e Documentação</h3>
              <div className="grid grid-cols-1 gap-4">
                {checklist.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-3xl border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${item.status === 'CONFORME' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                        {item.status === 'CONFORME' ? <CheckCircle /> : <XCircle />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.cat}</p>
                        <h4 className="font-bold text-slate-700">{item.desc}</h4>
                      </div>
                    </div>
                    
                    {item.status === 'CONFORME' && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vencimento: {item.validade}</p>
                        <div className={`text-xs font-black mt-1 ${item.diasRestantes < 30 ? 'text-red-500' : item.diasRestantes < 90 ? 'text-amber-500' : 'text-green-500'}`}>
                          {item.diasRestantes} dias restantes
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: ARRASTE E COLE */}
          {aba === 'upload' && (
            <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center hover:border-green-400 transition-all group relative animate-in zoom-in">
              <UploadCloud size={64} className="mx-auto mb-6 text-slate-300 group-hover:text-green-500 transition-all" />
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">Ingestão Maximus</h3>
              <p className="text-slate-400 font-bold text-sm mb-10">Arraste CIV, CIPP, MOPP, ANTT, JSON ou FOTOS</p>
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              <span className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px]">Anexar Documentação</span>
            </div>
          )}

          {/* ABA: DADOS DO PROPONENTE */}
          {aba === 'dashboard' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in">
              <div className="grid grid-cols-2 gap-8">
                <InputGroup label="Razão Social" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
                <InputGroup label="CNPJ" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
                <InputGroup label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
                <InputGroup label="CREA" value={dados.creasql} onChange={(v) => setDados({...dados, creasql: v})} />
                <InputGroup label="Cidade" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// COMPONENTES UI REUTILIZÁVEIS
function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
    }`}>
      {icon} {label}
    </button>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-green-500 font-bold text-slate-700"/>
    </div>
  );
}
