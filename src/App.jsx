import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Eye, Trash2, Search, Database } from 'lucide-react';

// --- CONEXÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV27() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState("Iniciando rastreio...");
  
  const CNPJ_CAELI = '38.404.019/0001-76';

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    setLoading(true);
    setDiagnostico("Buscando no banco de dados...");
    
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', CNPJ_CAELI)
      .order('created_at', { ascending: false });
    
    if (error) {
      setDiagnostico("ERRO DE CONEXÃO: " + error.message);
    } else {
      setArquivos(data || []);
      setDiagnostico(`Sucesso! Encontrados ${data?.length || 0} documentos para a Caeli.`);
    }
    setLoading(false);
  }

  const handleUpload = async (e) => {
    setLoading(true);
    setDiagnostico("Enviando novos arquivos...");
    for (const file of Array.from(e.target.files)) {
      const path = `${CNPJ_CAELI}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais').upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          empresa_cnpj: CNPJ_CAELI,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl
        }]);
      }
    }
    carregarArquivos();
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {/* STATUS DE DIAGNÓSTICO (O segredo para saber por que não carrega) */}
      <div style={{ backgroundColor: '#020617', color: '#4ade80', padding: '15px 30px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '2px solid #22c55e' }}>
        <Database size={20} />
        <span style={{ fontWeight: 'bold' }}>STATUS DO SISTEMA: {diagnostico}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        <ShieldCheck size={50} color="#22c55e" />
        <h1 style={{ fontSize: '28px', margin: 0 }}>MAXIMUS v27 - CONTROLE TOTAL</h1>
      </div>

      {/* ÁREA DE UPLOAD */}
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '25px', border: '3px dashed #cbd5e1', textAlign: 'center', marginBottom: '30px' }}>
        <input type="file" multiple onChange={handleUpload} id="f" hidden />
        <label htmlFor="f" style={{ cursor: 'pointer' }}>
          <UploadCloud size={50} color="#22c55e" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Clique aqui para adicionar os documentos da Caeli</p>
          <div style={{ background: '#22c55e', color: 'white', padding: '12px 30px', borderRadius: '10px', marginTop: '10px', display: 'inline-block' }}>
            {loading ? "PROCESSANDO..." : "CARREGAR PDFS"}
          </div>
        </label>
      </div>

      {/* LISTA IDENTIFICADA UM A UM */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#0f172a' }}>Documentos Identificados</h2>
            <button onClick={carregarArquivos} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Search size={20}/></button>
        </div>

        {arquivos.map((arq) => (
          <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fdfdfd', marginBottom: '10px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FileText size={30} color="#3b82f6" />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{arq.nome_arquivo}</span>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '10px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>VER</a>
              <button onClick={async () => { if(confirm("Excluir?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={20}/></button>
            </div>
          </div>
        ))}

        {arquivos.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Nenhum arquivo encontrado no banco de dados para este CNPJ.
          </div>
        )}
      </div>
    </div>
  );
}
