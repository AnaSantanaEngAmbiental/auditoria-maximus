import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Eye, Trash2, AlertTriangle } from 'lucide-react';

// --- CONEXÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV28() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("A aguardar upload...");

  const CNPJ_CAELI = '38.404.019/0001-76';

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    // Tentativa de ler tudo o que existe na tabela para forçar a exibição
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) setStatus("Erro no banco: " + error.message);
    else setArquivos(data || []);
  }

  const handleUpload = async (e) => {
    setLoading(true);
    setStatus("A enviar ficheiro...");
    const file = e.target.files[0];
    if (!file) return;

    const path = `${CNPJ_CAELI}/${Date.now()}_${file.name}`;
    
    // 1. Envia para o Storage
    const { error: storageError } = await supabase.storage
      .from('processos-ambientais').upload(path, file);

    if (storageError) {
      setStatus("Erro no Storage: " + storageError.message);
    } else {
      // 2. Regista na Tabela
      const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{
        empresa_cnpj: CNPJ_CAELI,
        nome_arquivo: file.name,
        url_publica: urlData.publicUrl
      }]);
      setStatus("Sucesso! O ficheiro foi carregado.");
      carregarArquivos();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      <div style={{ backgroundColor: '#020617', padding: '30px', borderRadius: '20px', color: 'white', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>MAXIMUS v28 - RECUPERAÇÃO</h1>
        <p style={{ color: '#4ade80', fontWeight: 'bold' }}>Status: {status}</p>
      </div>

      {/* ÁREA DE UPLOAD SIMPLES */}
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', border: '3px dashed #cbd5e1', textAlign: 'center', marginBottom: '30px' }}>
        <input type="file" onChange={handleUpload} id="f" hidden />
        <label htmlFor="f" style={{ cursor: 'pointer', display: 'block' }}>
          <UploadCloud size={50} color="#22c55e" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Clique aqui e selecione o PDF do OFÍCIO</p>
          <div style={{ background: '#22c55e', color: 'white', padding: '15px 30px', borderRadius: '10px', marginTop: '10px', display: 'inline-block' }}>
            {loading ? "A CARREGAR..." : "ESCOLHER FICHEIRO"}
          </div>
        </label>
      </div>

      {/* LISTAGEM FORÇADA */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Documentos Encontrados ({arquivos.length})</h2>
        
        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #eee', marginBottom: '10px', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FileText size={30} color="#3b82f6" />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{arq.nome_arquivo}</span>
            </div>
            <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>ABRIR PDF</a>
          </div>
        ))}

        {arquivos.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            <AlertTriangle size={40} style={{ marginBottom: '10px' }} />
            <p>A base de dados ainda está vazia. Precisa de fazer o upload do Ofício acima.</p>
          </div>
        )}
      </div>
    </div>
  );
}
