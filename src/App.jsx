import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Eye, Trash2, FileSpreadsheet, Image as ImageIcon, FileCode } from 'lucide-react';

// --- CONEXÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV30() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Sistema pronto para receber múltiplos formatos.");

  const CNPJ_CAELI = '38.404.019/0001-76';

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', CNPJ_CAELI)
      .order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  // Função para ícone dinâmico baseado no tipo de arquivo
  const renderIcon = (nome) => {
    const ext = nome.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={35} color="#107c10" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <ImageIcon size={35} color="#e11d48" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={35} color="#2b579a" />;
    return <FileText size={35} color="#3b82f6" />;
  };

  const handleUploadMutiplo = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setStatus(`Processando ${files.length} arquivos...`);

    for (const file of files) {
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

    setStatus("Todos os arquivos foram integrados ao dossiê!");
    carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      <div style={{ backgroundColor: '#020617', padding: '40px', borderRadius: '30px', color: 'white', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>MAXIMUS v30</h1>
          <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>{status}</p>
        </div>
        <ShieldCheck size={70} color="#22c55e" />
      </div>

      {/* ÁREA DE UPLOAD MULTIFORMATO */}
      <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '30px', border: '5px dashed #cbd5e1', textAlign: 'center', marginBottom: '40px' }}>
        <input 
          type="file" 
          multiple 
          accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
          onChange={handleUploadMutiplo} 
          id="multi-upload" 
          hidden 
        />
        <label htmlFor="multi-upload" style={{ cursor: 'pointer', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            <FileText size={40} color="#3b82f6" />
            <FileSpreadsheet size={40} color="#107c10" />
            <ImageIcon size={40} color="#e11d48" />
          </div>
          <h2 style={{ fontSize: '28px', color: '#1e293b' }}>Selecione PDFs, Fotos ou Planilhas</h2>
          <p style={{ fontSize: '18px', color: '#64748b' }}>Você pode marcar tudo de uma vez com o mouse</p>
          <div style={{ background: '#22c55e', color: 'white', padding: '20px 60px', borderRadius: '15px', marginTop: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '20px' }}>
            {loading ? "ENVIANDO..." : "ESCOLHER ARQUIVOS"}
          </div>
        </label>
      </div>

      {/* LISTA DE DOSSIÊ */}
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '30px', color: '#0f172a', borderBottom: '3px solid #22c55e', width: 'fit-content' }}>
          ARQUIVOS IDENTIFICADOS ({arquivos.length})
        </h3>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          {arquivos.map((arq) => (
            <div key={arq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                {renderIcon(arq.nome_arquivo)}
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{arq.nome_arquivo}</span>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '15px 30px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>ABRIR</a>
                <button onClick={async () => { if(confirm("Excluir arquivo?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '15px', borderRadius: '12px', cursor: 'pointer' }}><Trash2 size={25}/></button>
              </div>
            </div>
          ))}

          {arquivos.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '22px', padding: '40px' }}>O dossiê está vazio. Selecione os arquivos acima para começar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
