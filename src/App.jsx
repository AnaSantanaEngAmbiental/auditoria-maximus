import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Printer, Trash2, 
  CheckCircle2, AlertTriangle, FileSignature, Database, HardDrive
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'SUA_CHAVE_AQUI'; // Substitua pela sua chave real
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SilamMaximusV8() {
  const [aba, setAba] = useState('upload');
  const [dados, setDados] = useState({ razao: '', cnpj: '', cidade: 'Belém' });
  const [arquivosDb, setArquivosDb] = useState([]); // Documentos (PDF, XLSX, etc)
  const [fotosDb, setFotosDb] = useState([]);      // Imagens (JPEG, PNG)
  const [loading, setLoading] = useState(false);

  // Carregar arquivos existentes ao mudar o CNPJ
  useEffect(() => {
    if (dados.cnpj) carregarDadosDoBanco();
  }, [dados.cnpj]);

  async function carregarDadosDoBanco() {
    const { data } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj);
    
    if (data) {
      setFotosDb(data.filter(f => f.categoria === 'FOTO'));
      setArquivosDb(data.filter(f => f.categoria === 'DOCUMENTO'));
    }
  }

  // FUNÇÃO MESTRE DE ARRASTE E COLE
  const handleFileUpload = async (e) => {
    if (!dados.cnpj) return alert("Por favor, insira o CNPJ da empresa antes de enviar arquivos.");
    setLoading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${dados.cnpj}/${fileName}`;

      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('processos-ambientais')
        .upload(filePath, file);

      if (uploadError) { console.error(uploadError); continue; }

      // 2. Link Público
      const { data: urlData } = supabase.storage
        .from('processos-ambientais')
        .getPublicUrl(filePath);

      // 3. Salvar Metadados na Tabela arquivos_processo
      const categoria = file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO';
      
      await supabase.from('arquivos_processo').insert([{
        nome_arquivo: file.name,
        tipo_arquivo: fileExt,
        url_publica: urlData.publicUrl,
        empresa_cnpj: dados.cnpj,
        categoria: categoria
      }]);
    }
    carregarDadosDoBanco();
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col p-6 no-print shadow-2xl">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-700 pb-8">
          <div className="bg-green-500 p-2.5 rounded-2xl"><ShieldCheck size={28}/></div>
          <h1 className="text-xl font-black italic">MAXIMUS <span className="text-xs font-normal">v8.0</span></h1>
        </div>

        <nav className="space-y-2 flex-1">
          <MenuBtn icon={<Database />} label="Gestão de Arquivos" active={aba === 'upload'} onClick={() => setAba('upload')} />
          <MenuBtn icon={<Camera />} label="Relatório de Fotos" active={aba === 'fotos'} onClick={() => setAba('fotos')} />
          <MenuBtn icon={<FileSignature />} label="Gerar Documentos" active={aba === 'docs'} onClick={() => setAba('docs')} />
        </nav>

        <div className="mt-auto bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
          <input 
            placeholder="CNPJ DA EMPRESA" 
            className="w-full bg-slate-900 text-white text-[10px] p-3 rounded-xl border-none outline-none font-bold text-center"
            value={dados.cnpj} onChange={(e) => setDados({...dados, cnpj: e.target.value})}
          />
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b flex justify-between items-center px-10 no-print sticky top-0 z-50">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {loading ? "Processando Arquivos..." : "Sistema de Auditoria Ambiental Maximus"}
           </h2>
        </header>

        <div className="p-10 max-w-6xl mx-auto">
          
          {/* ABA: ARRASTE E COLE */}
          {aba === 'upload' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-green-400 transition-all group relative">
                <UploadCloud size={48} className="mx-auto mb-4 text-slate-300 group-hover:text-green-500 transition" />
                <h3 className="text-xl font-black text-slate-800 italic uppercase">Central de Ingestão de Dados</h3>
                <p className="text-sm text-slate-400 font-bold mb-8">PDF, DOCX, XLSX, JSON e IMAGENS</p>
                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Selecionar Manualmente</button>
              </div>

              {/* LISTA DE DOCUMENTOS TÉCNICOS */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 text-xs uppercase mb-6 flex items-center gap-2 italic">
                  <HardDrive size={16} className="text-blue-500" /> Biblioteca de Evidências ({arquivosDb.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arquivosDb.map((arq, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-600 truncate w-40">{arq.nome_arquivo}</span>
                      </div>
                      <a href={arq.url_publica} target="_blank" rel="noreferrer" className="text-blue-500 hover:scale-110 transition"><Printer size={16}/></a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA: RELATÓRIO FOTOGRÁFICO */}
          {aba === 'fotos' && (
            <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
              {fotosDb.map((f, i) => (
                <div key={i} className="bg-white p-4 rounded-[2.5rem] border shadow-sm break-inside-avoid">
                  <img src={f.url_publica} className="h-64 w-full object-cover rounded-[2rem] mb-4" alt="Evidência" />
                  <textarea 
                    placeholder="Legenda técnica para o relatório..."
                    className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-[10px] font-bold text-slate-500 h-20"
                    defaultValue={f.legenda_tecnica}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function MenuBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-[11px] font-black uppercase ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40' : 'text-slate-500 hover:bg-slate-800'
    }`}>
      {icon} {label}
    </button>
  );
}
