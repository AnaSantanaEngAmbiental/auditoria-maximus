import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV33() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const CNPJ_CAELI = '38.404.019/0001-76';

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
      const path = `dossie/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!storageError || storageError.message.includes('already exists')) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // Inserção simples sem depender de sequences do banco
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: CNPJ_CAELI, 
          nome_arquivo: file.name, 
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
          <h2 style={{ margin: 0 }}>MAXIMUS v33</h2>
          <p style={{ margin: 0, color: loading ? '#fbbf24' : '#4ade80' }}>
            {loading ? "Gravando arquivos..." : "Sistema Pronto"}
          </p>
        </div>
        <CheckCircle2 color={loading ? "#fbbf24" : "#4ade80"} size={40} />
      </div>

      <div style={{ backgroundColor: 'white', padding: '50px', borderRadius: '20px', border: '3px dashed #cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" multiple onChange={handleUploadMutiplo} id="m" hidden />
        <label htmlFor="m" style={{ cursor: 'pointer' }}>
          <UploadCloud size={60} color="#3b82f6" style={{ marginBottom: '10px' }} />
          <h3>Clique para subir os 13 arquivos</h3>
          <p>Selecione todos usando o mouse ou Shift + Clique</p>
          <div style={{ background: '#3b82f6', color: 'white', padding: '15px 40px', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px', display: 'inline-block' }}>
            {loading ? "PROCESSANDO..." : "CARREGAR AGORA"}
          </div>
        </label>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px' }}>
        <h3>Documentos na Lista ({arquivos.length})</h3>
        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText color="#3b82f6" />
              <span style={{ fontWeight: 'bold' }}>{arq.nome_arquivo}</span>
            </div>
            <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none' }}>ABRIR</a>
          </div>
        ))}
      </div>
    </div>
  );
}
