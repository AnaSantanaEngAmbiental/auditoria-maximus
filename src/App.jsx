import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, 
  Building2, Eye, Trash2, CheckCircle2
} from 'lucide-react';

// --- CONEXÃO CONFIGURADA ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; // Insira sua Anon Key do painel Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV21() {
  const [aba, setAba] = useState('upload');
  const [loading, setLoading] = useState(false);
  // Dados extraídos dos seus documentos PDF
  const [dados, setDados] = useState({ 
    razao: 'CARDOSO & RATES, TRANSPORTE DE CARGA LTDA', 
    cnpj: '38.404.019/0001-76', 
    tecnico: 'ANA PAULA SANTANA PEREIRA', 
    cidade: 'MARABÁ/PA' 
  });
  const [arquivos, setArquivos] = useState([]);

  useEffect(() => {
    carregarArquivos();
  }, [dados.cnpj]);

  async function carregarArquivos() {
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj)
      .order('created_at', { ascending: false });
    
    if (!error && data) setArquivos(data);
  }

  const realizarUpload = async (files) => {
    setLoading(true);
    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${dados.cnpj}/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais').upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          empresa_cnpj: dados.cnpj,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR COM DADOS REAIS */}
      <nav style={{ width: '380px', backgroundColor: '#020617', color: 'white', padding: '40px 25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px' }}>
          <ShieldCheck color="#22c55e" size={45} />
          <h1 style={{ fontSize: '28px', fontWeight: '900' }}>MAXIMUS <span style={{color:'#4ade80'}}>V21</span></h1>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <MenuBtn active={aba === 'dashboard'} onClick={() => setAba('dashboard')} icon={<Building2 size={24}/>} label="Dados do Cliente" />
          <MenuBtn active={aba === 'upload'} onClick={() => setAba('upload')} icon={<UploadCloud size={24}/>} label="Dossiê Digital" />
          <MenuBtn active={aba === 'fotos'} onClick={() => setAba('fotos')} icon={<Camera size={24}/>} label="Relatório de Fotos" />
        </div>

        {/* STATUS DO CNPJ EXTRAÍDO */}
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '25px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <CheckCircle2 size={16} color="#4ade80" />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>CNPJ IDENTIFICADO</span>
          </div>
          <p style={{ color: '#4ade80', fontWeight: '900', fontSize: '22px', margin: 0 }}>{dados.cnpj}</p>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>{dados.razao}</p>
        </div>
      </nav>

      {/* CONTEÚDO COM FONTES AMPLIADAS */}
      <main style={{ flex: 1, padding: '60px', overflowY: 'auto' }}>
        
        {aba === 'upload' && (
          <div style={{ maxWidth: '1100px' }}>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); realizarUpload(e.dataTransfer.files); }}
              style={{
                border: '4px dashed #CBD5E1', backgroundColor: 'white',
                padding: '80px 40px', borderRadius: '40px', textAlign: 'center'
              }}
            >
              <UploadCloud size={80} color="#22c55e" style={{ marginBottom: '20px' }} />
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A' }}>Arraste seus Documentos</h2>
              <p style={{ fontSize: '18px', color: '#64748B', marginBottom: '30px' }}>Clique abaixo para selecionar múltiplos PDFs ou Fotos</p>
              
              <input type="file" multiple id="up" hidden onChange={(e) => realizarUpload(e.target.files)} />
              <label htmlFor="up" style={{ background: '#22c55e', color: 'white', padding: '20px 50px', borderRadius: '15px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
                {loading ? "PROCESSANDO..." : "CARREGAR ARQUIVOS"}
              </label>
            </div>

            {/* LISTAGEM UM A UM */}
            <div style={{ marginTop: '50px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '25px' }}>
                DOCUMENTOS NO DOSSIÊ ({arquivos.length})
              </h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {arquivos.map((arq) => (
                  <div key={arq.id} style={{ background: 'white', padding: '25px 35px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <FileText size={30} color="#3B82F6" />
                      <div>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', display: 'block' }}>{arq.nome_arquivo}</span>
                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Enviado em: {new Date(arq.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#F1F5F9', color: '#0F172A', padding: '12px', borderRadius: '12px' }}><Eye size={24}/></a>
                      <button onClick={() => { if(confirm("Remover?")) supabase.from('arquivos_processo').delete().eq('id', arq.id).then(carregarArquivos); }} style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><Trash2 size={24}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'dashboard' && (
          <div style={{ background: 'white', padding: '60px', borderRadius: '40px', maxWidth: '900px' }}>
             <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '40px' }}>INFORMAÇÕES DO EMPREENDIMENTO</h2>
             <div style={{ display: 'grid', gap: '30px' }}>
                <BigInput label="Razão Social" value={dados.razao} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <BigInput label="CNPJ" value={dados.cnpj} />
                  <BigInput label="Município" value={dados.cidade} />
                </div>
                <BigInput label="Responsável Técnico (Consultora)" value={dados.tecnico} />
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MenuBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '20px 25px',
      borderRadius: '18px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '800',
      backgroundColor: active ? '#22c55e' : 'transparent',
      color: active ? 'white' : '#64748B', transition: '0.2s'
    }}> {icon} {label} </button>
  );
}

function BigInput({ label, value }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '900', color: '#94A3B8', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>{label}</label>
      <input readOnly value={value} style={{ width: '100%', padding: '20px', borderRadius: '15px', border: '2px solid #F1F5F9', fontSize: '18px', fontWeight: '700', backgroundColor: '#F8FAFC', color: '#1E293B' }} />
    </div>
  );
}
