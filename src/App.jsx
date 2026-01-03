import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, FileText, CheckCircle2, RefreshCw, 
  Search, ShieldCheck, AlertCircle, FileStack, Eye 
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV39() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('Todos');

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
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!storageError || storageError.message.includes('already exists')) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: '38.404.019/0001-76', 
          nome_arquivo: nomeLimpo, 
          url_publica: urlData.publicUrl,
          status: 'Em Análise' // Novo campo para auditoria
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Profissional */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', color: 'white' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="#10b981" /> MAXIMUS AUDITORIA
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>Gestão de Dossiês Ambientais - Caeli Transportes</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ backgroundColor: '#1e293b', padding: '8px 15px', borderRadius: '20px', fontSize: '12px' }}>
            {loading ? "Processando..." : "Sistema Online"}
          </span>
        </div>
      </header>

      {/* Grid de Controle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }}>
        
        {/* Lado Esquerdo: Ações e Filtros */}
        <aside>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Ações Rápidas</h3>
            <input type="file" multiple onChange={handleUploadMutiplo} id="upload" hidden />
            <label htmlFor="upload" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              <UploadCloud size={20} /> SUBIR DOCUMENTOS
            </label>

            <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />
            
            <h3 style={{ fontSize: '16px' }}>Resumo do Dossiê</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Total de Arquivos:</span>
                <strong>{arquivos.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10b981' }}>
                <span>Meta Mínima:</span>
                <strong>13</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Lado Direito: Lista de Auditoria */}
        <main style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Documentos em Auditoria</h3>
            <button onClick={carregarArquivos} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '15px' }}>Documento</th>
                <th style={{ padding: '15px' }}>Data de Upload</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.map((arq) => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileStack size={18} color="#94a3b8" />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{arq.nome_arquivo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#64748b' }}>
                    {new Date(arq.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                      EM ANÁLISE
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3b82f6', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                      <Eye size={16} /> VISUALIZAR
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {arquivos.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <AlertCircle size={40} style={{ marginBottom: '10px' }} />
              <p>Nenhum documento pendente de auditoria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
