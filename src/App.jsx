import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, RefreshCw, Search, ShieldCheck, 
  FileStack, Eye, XCircle, CheckCircle, FileBarChart 
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV42() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const arquivosFiltrados = arquivos.filter(arq => 
    arq.nome_arquivo.toLowerCase().includes(busca.toLowerCase())
  );

  async function alterarStatus(id, novoStatus) {
    const { error } = await supabase.from('arquivos_processo').update({ status: novoStatus }).eq('id', id);
    if (!error) await carregarArquivos();
  }

  // GERADOR DE RELATÓRIO SIMPLES
  const gerarRelatorio = () => {
    const aprovados = arquivos.filter(a => a.status === 'Aprovado').length;
    const conteudo = arquivos.map(a => `${a.nome_arquivo} - [${a.status || 'PENDENTE'}]`).join('\n');
    alert(`--- RELATÓRIO DE AUDITORIA ---\nEmpresa: CAELI TRANSPORTES\nTotal: ${arquivos.length} arquivos\nAprovados: ${aprovados}\n\nDetalhamento:\n${conteudo}`);
  };

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
          empresa_cnpj: '38.404.019/0001-76', nome_arquivo: nomeLimpo, url_publica: urlData.publicUrl, status: 'Pendente'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  // ESTILOS DE ANIMAÇÃO (HOVER)
  const rowStyle = { transition: 'all 0.3s ease', cursor: 'pointer' };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      
      {/* HEADER AMPLIADO */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '25px 40px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', letterSpacing: '-1px' }}>MAXIMUS v42</h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '18px' }}>Auditoria Caeli Transportes</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <input 
            type="text" placeholder="Pesquisar..." value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', fontSize: '16px', width: '300px' }}
          />
          <button onClick={gerarRelatorio} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
            <FileBarChart size={20} /> RELATÓRIO
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Upload</h3>
            <input type="file" multiple onChange={handleUploadMutiplo} id="f" hidden />
            <label htmlFor="f" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px', borderRadius: '10px', display: 'block', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
              {loading ? "CARREGANDO..." : "ENVIAR ARQUIVOS"}
            </label>
          </div>

          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px' }}>Conformidade</h3>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a' }}>{arquivos.length}/13</div>
            <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '15px', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${(arquivos.length / 13) * 100}%`, backgroundColor: '#10b981', height: '100%' }}></div>
            </div>
          </div>
        </aside>

        <main style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr style={{ textAlign: 'left', fontSize: '18px' }}>
                <th style={{ padding: '20px' }}>Documento</th>
                <th style={{ padding: '20px' }}>Status</th>
                <th style={{ padding: '20px' }}>Auditoria</th>
                <th style={{ padding: '20px' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {arquivosFiltrados.map((arq) => (
                <tr 
                  key={arq.id} 
                  style={rowStyle}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '20px', fontSize: '18px', fontWeight: '500' }}>{arq.nome_arquivo}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                      padding: '8px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
                      backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : arq.status === 'Recusado' ? '#fee2e2' : '#fef3c7',
                      color: arq.status === 'Aprovado' ? '#166534' : arq.status === 'Recusado' ? '#991b1b' : '#92400e'
                    }}>
                      {arq.status?.toUpperCase() || 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => alterarStatus(arq.id, 'Aprovado')} style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', color: '#16a34a' }}><CheckCircle size={24} /></button>
                      <button onClick={() => alterarStatus(arq.id, 'Recusado')} style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><XCircle size={24} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}>ABRIR</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
