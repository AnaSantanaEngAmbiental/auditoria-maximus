import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Eye, Trash2, CheckCircle } from 'lucide-react';

// --- CONEXÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV26() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const CNPJ_ALVO = '38.404.019/0001-76'; // CAELI TRANSPORTES

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', CNPJ_ALVO)
      .order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const handleUpload = async (e) => {
    setLoading(true);
    for (const file of Array.from(e.target.files)) {
      const path = `${CNPJ_ALVO}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais').upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          empresa_cnpj: CNPJ_ALVO,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl
        }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {/* CABEÇALHO GRANDE */}
      <div style={{ backgroundColor: '#020617', padding: '40px', borderRadius: '25px', color: 'white', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ShieldCheck size={60} color="#22c55e" />
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>MAXIMUS v26 - CAELI</h1>
          <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>PLACAS: TVO9D07 e TVO9D17</p>
        </div>
      </div>

      {/* BOX DE UPLOAD */}
      <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '30px', textAlign: 'center', border: '4px dashed #cbd5e1', marginBottom: '40px' }}>
        <input type="file" multiple onChange={handleUpload} id="fileInput" hidden />
        <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
          <UploadCloud size={80} color="#22c55e" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '26px' }}>Arraste os documentos aqui</h2>
          <div style={{ background: '#020617', color: 'white', padding: '20px 40px', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', display: 'inline-block', marginTop: '20px' }}>
            {loading ? "SUBINDO..." : "SELECIONAR ARQUIVOS"}
          </div>
        </label>
      </div>

      {/* LISTA DE DOCUMENTOS - UM A UM COM LETRA GRANDE */}
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '30px' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '30px', color: '#0f172a' }}>DOCUMENTOS NO SISTEMA ({arquivos.length})</h3>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          {arquivos.map((arq) => (
            <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <FileText size={40} color="#3b82f6" />
                <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{arq.nome_arquivo}</span>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#22c55e', color: 'white', padding: '15px 30px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>ABRIR PDF</a>
                <button onClick={async () => { if(confirm("Remover?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '15px', borderRadius: '10px', cursor: 'pointer' }}><Trash2/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
