import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Trash2 } from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV32() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const CNPJ_CAELI = '38.404.019/0001-76';

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').eq('empresa_cnpj', CNPJ_CAELI).order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const handleUploadMutiplo = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      // O segredo: Adicionamos um código único para o sistema não dizer que "já existe"
      const idUnico = Math.random().toString(36).substring(7);
      const path = `${CNPJ_CAELI}/${idUnico}_${file.name}`;
      
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!storageError || storageError.message.includes('already exists')) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // Força a inserção na tabela
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: CNPJ_CAELI, 
          nome_arquivo: file.name, 
          url_publica: urlData.publicUrl 
        }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial' }}>
      <div style={{ backgroundColor: '#020617', padding: '20px', borderRadius: '15px', color: 'white', marginBottom: '20px' }}>
        <h2>MAXIMUS v32 - LIMPEZA E CARGA</h2>
        <p>Status: {loading ? "Gravando arquivos no banco..." : "Pronto"}</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', border: '3px dashed #22c55e', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" multiple onChange={handleUploadMutiplo} id="m" hidden />
        <label htmlFor="m" style={{ cursor: 'pointer' }}>
          <UploadCloud size={50} color="#22c55e" />
          <h3>Clique aqui e selecione os 13 arquivos novamente</h3>
          <div style={{ background: '#22c55e', color: 'white', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold' }}>
            {loading ? "ENVIANDO..." : "CARREGAR TUDO AGORA"}
          </div>
        </label>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px' }}>
        <h3>Dossiê Identificado ({arquivos.length} arquivos)</h3>
        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
            <span>{arq.nome_arquivo}</span>
            <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '5px 15px', borderRadius: '5px', textDecoration: 'none' }}>ABRIR</a>
          </div>
        ))}
      </div>
    </div>
  );
}
