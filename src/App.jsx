// Use este código no seu editor (Vercel/Editor)
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Trash2, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV31() {
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
      const path = `${CNPJ_CAELI}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ empresa_cnpj: CNPJ_CAELI, nome_arquivo: file.name, url_publica: urlData.publicUrl }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial' }}>
      <div style={{ backgroundColor: '#020617', padding: '30px', borderRadius: '20px', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px' }}>MAXIMUS v31 - MULTIFORMATO</h1>
        <ShieldCheck size={40} color="#22c55e" />
      </div>

      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', border: '3px dashed #cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png" onChange={handleUploadMutiplo} id="m" hidden />
        <label htmlFor="m" style={{ cursor: 'pointer' }}>
          <UploadCloud size={50} color="#22c55e" />
          <h3>Clique e selecione TODOS os 13 arquivos (Use Shift + Clique)</h3>
          <div style={{ background: '#22c55e', color: 'white', padding: '15px 30px', borderRadius: '10px', display: 'inline-block', fontWeight: 'bold' }}>
            {loading ? "ENVIANDO DOSSIÊ..." : "ESCOLHER ARQUIVOS"}
          </div>
        </label>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px' }}>
        <h3>Arquivos Identificados ({arquivos.length})</h3>
        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
            <span>{arq.nome_arquivo}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '8px 15px', borderRadius: '5px', textDecoration: 'none' }}>VER</a>
              <button onClick={async () => { if(confirm("Excluir?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
