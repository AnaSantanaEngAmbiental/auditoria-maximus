import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; // Use sua chave correta aqui
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV35() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const handleUploadMutiplo = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      // FUNÇÃO CRUCIAL: Remove acentos e caracteres que causam o Erro 400
      const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_");
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!storageError || storageError.message.includes('already exists')) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: '38.404.019/0001-76', 
          nome_arquivo: nomeLimpo, 
          url_publica: urlData.publicUrl 
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial' }}>
      <div style={{ backgroundColor: '#020617', padding: '20px', borderRadius: '15px', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>MAXIMUS v35</h2>
          <p style={{ margin: 0, color: loading ? '#fbbf24' : '#4ade80' }}>
            {loading ? "Limpando nomes e gravando..." : "Sistema Pronto - Sem Acentos"}
          </p>
        </div>
        <CheckCircle2 color={loading ? "#fbbf24" : "#4ade80"} size={40} />
      </div>

      <div style={{ backgroundColor: 'white', padding: '50px', borderRadius: '20px', border: '3px dashed #cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" multiple onChange={handleUploadMutiplo} id="m" hidden />
        <label htmlFor="m" style={{ cursor: 'pointer' }}>
          <UploadCloud size={60} color="#3b82f6" style={{ marginBottom: '10px' }} />
          <h3>Clique para subir os 13 arquivos</h3>
          <div style={{ background: '#3b82f6', color: 'white', padding: '15px 40px', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', display: 'inline-block' }}>
            {loading ? "PROCESSANDO..." : "CARREGAR AGORA"}
          </div>
        </label>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px' }}>
        <h3>Documentos na Lista ({arquivos.length})</h3>
        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
            <span style={{ fontWeight: 'bold' }}>{arq.nome_arquivo}</span>
            <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none' }}>ABRIR</a>
          </div>
        ))}
      </div>
    </div>
  );
}
