import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, CheckCircle2, RefreshCw, 
  Search, ShieldCheck, FileStack, Eye, XCircle, CheckCircle
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV40() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  // FUNÇÃO DE BUSCA: Filtra a lista enquanto você digita
  const arquivosFiltrados = arquivos.filter(arq => 
    arq.nome_arquivo.toLowerCase().includes(busca.toLowerCase())
  );

  // FUNÇÃO DE STATUS: Atualiza no banco se o documento está OK ou não
  async function alterarStatus(id, novoStatus) {
    const { error } = await supabase
      .from('arquivos_processo')
      .update({ status: novoStatus })
      .eq('id', id);
    
    if (!error) carregarArquivos();
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
          status: 'Pendente'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>MAXIMUS v40 <span style={{ color: '#10b981', fontSize: '12px' }}>● LIVE</span></h1>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>Controle de Auditoria - Caeli Transportes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar documento..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ padding: '8px 10px 8px 35px', borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: 'white', width: '250px' }}
            />
          </div>
          <button onClick={carregarArquivos} style={{ background: '#1e293b', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* BARRA LATERAL */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0 }}>Upload</h3>
            <input type="file" multiple onChange={handleUploadMutiplo} id="up" hidden />
            <label htmlFor="up" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', display: 'block', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? "SUBINDO..." : "NOVOS ARQUIVOS"}
            </label>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0 }}>Progresso</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{arquivos.length} / 13</div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Arquivos mínimos exigidos</p>
            <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <div style={{ width: `${(arquivos.length / 13) * 100}%`, backgroundColor: '#10b981', height: '10px', borderRadius: '5px', transition: '0.5s' }}></div>
            </div>
          </div>
        </aside>

        {/* TABELA DE GESTÃO */}
        <main style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '13px' }}>
              <tr>
                <th style={{ padding: '15px' }}>Documento</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Decisão</th>
                <th style={{ padding: '15px' }}>Acesso</th>
              </tr>
            </thead>
            <tbody>
              {arquivosFiltrados.map((arq) => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontSize: '14px', fontWeight: '500' }}>{arq.nome_arquivo}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : arq.status === 'Recusado' ? '#fee2e2' : '#fef3c7',
                      color: arq.status === 'Aprovado' ? '#166534' : arq.status === 'Recusado' ? '#991b1b' : '#92400e'
                    }}>
                      {arq.status || 'Pendente'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => alterarStatus(arq.id, 'Aprovado')} style={{ padding: '5px', background: '#dcfce7', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#166534' }} title="Aprovar">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => alterarStatus(arq.id, 'Recusado')} style={{ padding: '5px', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#991b1b' }} title="Recusar">
                      <XCircle size={18} />
                    </button>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#0f172a', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px' }}>
                      <Eye size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> ABRIR
                    </a>
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
