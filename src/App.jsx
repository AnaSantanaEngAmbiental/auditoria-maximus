import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, RefreshCw, Search, ShieldCheck, 
  FileStack, Eye, XCircle, CheckCircle, AlertTriangle 
} from 'lucide-react';

// Configuração do Cliente
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV41() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // 1. Carregar dados ao iniciar
  useEffect(() => { 
    carregarArquivos(); 
  }, []);

  async function carregarArquivos() {
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setArquivos(data);
    if (error) console.error("Erro ao ler banco:", error.message);
  }

  // 2. Função de Busca (Filtro)
  const arquivosFiltrados = arquivos.filter(arq => 
    arq.nome_arquivo.toLowerCase().includes(busca.toLowerCase())
  );

  // 3. Função de Alterar Status (Aprovar/Recusar) - CORRIGIDA
  async function alterarStatus(id, novoStatus) {
    setLoading(true);
    const { error } = await supabase
      .from('arquivos_processo')
      .update({ status: novoStatus })
      .eq('id', id);
    
    if (error) {
      alert("Erro de permissão no banco! Verifique se rodou o comando SQL de UPDATE.");
      console.error(error.message);
    } else {
      await carregarArquivos(); // Recarrega a lista para mostrar a cor nova
    }
    setLoading(false);
  }

  // 4. Motor de Upload com Limpeza de Nomes
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
          status: 'Pendente'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* BARRA SUPERIOR (HEADER) */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 25px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="#10b981" /> MAXIMUS v41
          </h1>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '12px' }}>Auditoria Digital • Caeli Transportes</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Filtrar documentos..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ padding: '8px 10px 8px 35px', borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: 'white', width: '200px', fontSize: '14px' }}
            />
          </div>
          <button onClick={carregarArquivos} style={{ background: '#1e293b', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        {/* COLUNA LATERAL (CONTROLES) */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Novo Upload</h3>
            <input type="file" multiple onChange={handleUploadMutiplo} id="file-up" hidden />
            <label htmlFor="file-up" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              <UploadCloud size={18} /> {loading ? "ENVIANDO..." : "CARREGAR"}
            </label>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Progresso Geral</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{arquivos.length} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 13 arquivos</span></div>
            <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '15px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((arquivos.length / 13) * 100, 100)}%`, backgroundColor: '#10b981', height: '100%', transition: '0.5s' }}></div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>Meta mínima para conformidade ambiental.</p>
          </div>
        </aside>

        {/* TABELA PRINCIPAL (AUDITORIA) */}
        <main style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <tr>
                <th style={{ padding: '15px' }}>Nome do Arquivo</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Decisão Auditor</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {arquivosFiltrados.map((arq) => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileStack size={16} color="#94a3b8" />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{arq.nome_arquivo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : arq.status === 'Recusado' ? '#fee2e2' : '#fef3c7',
                      color: arq.status === 'Aprovado' ? '#166534' : arq.status === 'Recusado' ? '#991b1b' : '#92400e'
                    }}>
                      {arq.status?.toUpperCase() || 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => alterarStatus(arq.id, 'Aprovado')} 
                        style={{ padding: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', color: '#16a34a' }}
                        title="Aprovar Documento"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => alterarStatus(arq.id, 'Recusado')} 
                        style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}
                        title="Recusar Documento"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#0f172a', color: 'white', padding: '6px 15px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Eye size={14} /> ABRIR
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {arquivosFiltrados.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <AlertTriangle size={30} style={{ marginBottom: '10px' }} />
              <p>Nenhum documento encontrado.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
