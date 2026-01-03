import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UploadCloud, FileText, Camera, Gavel, 
  FileSignature, Building2, Scale, Key, Eye, Trash2
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE (VOLTANDO AO PADRÃO ANON) ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; // Substitua pela chave que aparece no seu painel Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SilamMaximusV18() {
  const [aba, setAba] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dados, setDados] = useState({
    razao: '', cnpj: '', tecnico: '', creasql: '', endereco: '', cidade: 'Belém'
  });

  const [arquivos, setArquivos] = useState([]);

  // Sincronização automática com o banco ao digitar CNPJ
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
    if (!dados.cnpj) return alert("⚠️ Digite o CNPJ no rodapé da lateral primeiro!");
    setLoading(true);
    
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${dados.cnpj}/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais')
        .upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage
          .from('processos-ambientais').getPublicUrl(path);

        await supabase.from('arquivos_processo').insert([{
          empresa_cnpj: dados.cnpj,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl,
          categoria: file.type.startsWith('image/') ? 'FOTO' : 'DOCUMENTO'
        }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  const deletarArquivo = async (id) => {
    if(!confirm("Deseja remover este item do dossiê?")) return;
    const { error } = await supabase.from('arquivos_processo').delete().eq('id', id);
    if (!error) carregarArquivos();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR TÉCNICA */}
      <nav style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <ShieldCheck color="#22c55e" size={32} />
          <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-1px' }}>MAXIMUS v18</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <MenuButton active={aba === 'dashboard'} onClick={() => setAba('dashboard')} icon={<Building2 size={18}/>} label="Dossiê Cliente" />
          <MenuButton active={aba === 'upload'} onClick={() => setAba('upload')} icon={<UploadCloud size={18}/>} label="Arraste e Cole" />
          <MenuButton active={aba === 'fotos'} onClick={() => setAba('fotos')} icon={<Camera size={18}/>} label="Relatório Fotos" />
          <MenuButton active={aba === 'oficio'} onClick={() => setAba('oficio')} icon={<FileSignature size={18}/>} label="Gerar Ofício" />
        </div>

        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '15px', border: '1px solid #334155' }}>
          <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>CNPJ ATIVO</label>
          <input 
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#4ade80', fontWeight: 'bold', outline: 'none', fontSize: '14px' }}
            value={dados.cnpj}
            onChange={(e) => setDados({...dados, cnpj: e.target.value})}
            placeholder="00.000.000/0000-00"
          />
        </div>
      </nav>

      {/* ÁREA DE TRABALHO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {aba === 'upload' && (
          <div>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); realizarUpload(Array.from(e.dataTransfer.files)); }}
              style={{
                border: '3px dashed ' + (dragging ? '#22c55e' : '#e2e8f0'),
                backgroundColor: dragging ? '#f0fdf4' : 'white',
                padding: '60px', borderRadius: '30px', textAlign: 'center', transition: '0.2s'
              }}
            >
              <UploadCloud size={50} color="#94a3b8" style={{ marginBottom: '15px' }} />
              <h2 style={{ fontWeight: '800', fontSize: '20px' }}>Arraste seus Arquivos</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Documentos PDF ou Fotos de Campo</p>
              <input type="file" multiple id="fileup" hidden onChange={(e) => realizarUpload(Array.from(e.target.files))} />
              <label htmlFor="fileup" style={{ background: '#0f172a', color: 'white', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                {loading ? "PROCESSANDO..." : "CARREGAR ARQUIVOS"}
              </label>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '15px' }}>DOCUMENTOS VINCULADOS</h3>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ background: 'white', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={16} color="#94a3b8" />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{arq.nome_arquivo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a href={arq.url_publica} target="_blank" style={{ color: '#3b82f6' }}><Eye size={18}/></a>
                    <button onClick={() => deletarArquivo(arq.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'dashboard' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '25px', color: '#1e293b' }}>INFORMAÇÕES DO CLIENTE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <Input label="Razão Social" value={dados.razao} onChange={(v) => setDados({...dados, razao: v})} />
              <Input label="CNPJ" value={dados.cnpj} onChange={(v) => setDados({...dados, cnpj: v})} />
              <Input label="Cidade / Município" value={dados.cidade} onChange={(v) => setDados({...dados, cidade: v})} />
              <Input label="Responsável Técnico" value={dados.tecnico} onChange={(v) => setDados({...dados, tecnico: v})} />
            </div>
          </div>
        )}

        {aba === 'fotos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {arquivos.filter(a => a.categoria === 'FOTO').map(foto => (
              <div key={foto.id} style={{ background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <img src={foto.url_publica} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                <p style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px', color: '#475569' }}>{foto.nome_arquivo}</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

// COMPONENTES DE INTERFACE
function MenuButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px',
      borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
      backgroundColor: active ? '#22c55e' : 'transparent',
      color: active ? 'white' : '#94a3b8', transition: '0.2s'
    }}> {icon} {label} </button>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>{label}</label>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '600' }}
      />
    </div>
  );
}
