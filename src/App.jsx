import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, 
  FileSignature, Building2, Key, Eye, Trash2
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV19() {
  const [aba, setAba] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({ razao: '', cnpj: '38.404.019/0001-76', tecnico: '', cidade: 'Belém' });
  const [arquivos, setArquivos] = useState([]);

  useEffect(() => {
    if (dados.cnpj.length >= 14) carregarArquivos();
  }, [dados.cnpj]);

  async function carregarArquivos() {
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', dados.cnpj)
      .order('created_at', { ascending: false });
    if (!error) setArquivos(data);
  }

  const realizarUpload = async (files) => {
    if (!dados.cnpj) return alert("⚠️ Digite o CNPJ primeiro!");
    setLoading(true);
    
    // Suporta múltiplos arquivos simultâneos
    const promises = Array.from(files).map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${dados.cnpj}/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais')
        .upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        return supabase.from('arquivos_processo').insert([{
          empresa_cnpj: dados.cnpj,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    });

    await Promise.all(promises);
    carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Segoe UI, Roboto, sans-serif', fontSize: '16px' }}>
      
      {/* SIDEBAR COM FONTES MAIORES */}
      <nav style={{ width: '320px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px' }}>
          <ShieldCheck color="#22c55e" size={40} />
          <h1 style={{ fontSize: '24px', fontWeight: '900' }}>MAXIMUS <span style={{color:'#4ade80'}}>v19</span></h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
          <MenuBtn active={aba === 'dashboard'} onClick={() => setAba('dashboard')} icon={<Building2/>} label="Dossiê Cliente" />
          <MenuBtn active={aba === 'upload'} onClick={() => setAba('upload')} icon={<UploadCloud/>} label="Arraste e Cole" />
          <MenuBtn active={aba === 'fotos'} onClick={() => setAba('fotos')} icon={<Camera/>} label="Relatório Fotos" />
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '20px', border: '1px solid #334155' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>CNPJ em Análise</label>
          <input 
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#4ade80', fontWeight: 'bold', outline: 'none', fontSize: '18px' }}
            value={dados.cnpj}
            onChange={(e) => setDados({...dados, cnpj: e.target.value})}
          />
        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL AMPLIADO */}
      <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        
        {aba === 'upload' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); realizarUpload(e.dataTransfer.files); }}
              style={{
                border: '4px dashed #e2e8f0', backgroundColor: 'white',
                padding: '80px 40px', borderRadius: '40px', textAlign: 'center'
              }}
            >
              <UploadCloud size={80} color="#cbd5e1" style={{ marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '800', fontSize: '28px', color: '#1e293b' }}>Central de Upload Multi-PDF</h2>
              <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '30px' }}>Arraste vários documentos de uma vez para o sistema</p>
              
              <input type="file" multiple id="fileup" hidden onChange={(e) => realizarUpload(e.target.files)} />
              <label htmlFor="fileup" style={{ background: '#0f172a', color: 'white', padding: '20px 40px', borderRadius: '15px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                {loading ? "SUBINDO ARQUIVOS..." : "SELECIONAR ARQUIVOS"}
              </label>
            </div>

            <div style={{ marginTop: '50px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Documentos Identificados</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {arquivos.map(arq => (
                  <div key={arq.id} style={{ background: 'white', padding: '20px 30px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <FileText size={24} color="#94a3b8" />
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>{arq.nome_arquivo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}><Eye size={24}/></a>
                      <button onClick={async () => { if(confirm("Remover?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={24}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'dashboard' && (
          <div style={{ background: 'white', padding: '60px', borderRadius: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '40px' }}>DADOS DO EMPREENDIMENTO</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <Input label="Razão Social" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
              <Input label="CNPJ Principal" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
              <Input label="Município / Cidade" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              <Input label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
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
      display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '18px 25px',
      borderRadius: '15px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '800',
      backgroundColor: active ? '#22c55e' : 'transparent',
      color: active ? 'white' : '#94a3b8', transition: '0.3s'
    }}> {React.cloneElement(icon, {size: 22})} {label} </button>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>{label}</label>
      <input 
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '20px', borderRadius: '15px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}
      />
    </div>
  );
}
