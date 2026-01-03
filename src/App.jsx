import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UploadCloud, FileText, Building2, Eye, Trash2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV23() {
  const [aba, setAba] = useState('upload');
  const [status, setStatus] = useState({ tipo: 'info', msg: 'Iniciando sistema...' });
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cnpjFoco = '38.404.019/0001-76'; // Caeli Transportes

  useEffect(() => {
    testarConexao();
    carregarArquivos();
  }, []);

  async function testarConexao() {
    const { error } = await supabase.from('arquivos_processo').select('id').limit(1);
    if (error) {
      setStatus({ tipo: 'erro', msg: `Erro de Conexão: ${error.message}` });
    } else {
      setStatus({ tipo: 'sucesso', msg: 'Conectado ao Banco Maximus com Sucesso!' });
    }
  }

  async function carregarArquivos() {
    const { data, error } = await supabase
      .from('arquivos_processo')
      .select('*')
      .eq('empresa_cnpj', cnpjFoco)
      .order('created_at', { ascending: false });
    
    if (error) setStatus({ tipo: 'erro', msg: error.message });
    else setArquivos(data || []);
  }

  const handleUpload = async (files) => {
    setLoading(true);
    setStatus({ tipo: 'info', msg: 'Subindo arquivos para o servidor...' });

    for (const file of Array.from(files)) {
      const path = `${cnpjFoco}/${Date.now()}_${file.name}`;
      
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais').upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{
          empresa_cnpj: cnpjFoco,
          nome_arquivo: file.name,
          url_publica: urlData.publicUrl,
          categoria: 'DOCUMENTO'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
    setStatus({ tipo: 'sucesso', msg: 'Arquivos sincronizados no dossiê!' });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'system-ui' }}>
      
      {/* SIDEBAR FIXA */}
      <nav style={{ width: '350px', backgroundColor: '#020617', color: 'white', padding: '40px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
          <ShieldCheck color="#22c55e" size={40} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MAXIMUS <span style={{color:'#4ade80'}}>V23</span></h2>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }}>Navegação</p>
          <button onClick={() => setAba('upload')} style={aba === 'upload' ? btnAtivo : btnInativo}> <FileText size={20}/> Dossiê de Documentos </button>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '15px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 5px 0' }}>CNPJ CAELI</p>
          <p style={{ color: '#4ade80', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{cnpjFoco}</p>
        </div>
      </nav>

      {/* ÁREA DE CONTEÚDO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* BARRA DE STATUS DINÂMICA */}
        <div style={{ 
          backgroundColor: status.tipo === 'erro' ? '#fee2e2' : status.tipo === 'sucesso' ? '#dcfce7' : '#e0f2fe',
          padding: '20px', borderRadius: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px',
          border: `2px solid ${status.tipo === 'erro' ? '#ef4444' : '#22c55e'}`
        }}>
          {status.tipo === 'erro' ? <AlertTriangle color="#ef4444"/> : <CheckCircle color="#22c55e"/>}
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{status.msg}</span>
        </div>

        <div style={{ maxWidth: '1000px' }}>
          {/* UPLOAD BOX */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            style={{ backgroundColor: 'white', padding: '60px', borderRadius: '30px', textAlign: 'center', border: '3px dashed #cbd5e1' }}
          >
            <UploadCloud size={60} color="#22c55e" style={{ marginBottom: '20px' }} />
            <h1 style={{ fontSize: '30px', fontWeight: '900', margin: '0 0 10px 0' }}>Gestão de Dossiê</h1>
            <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '30px' }}>Arraste os PDFs das carretas TVO9D07 e TVO9D17</p>
            
            <input type="file" multiple id="f" hidden onChange={(e) => handleUpload(e.target.files)} />
            <label htmlFor="f" style={{ background: '#020617', color: 'white', padding: '15px 40px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? "SINCRONIZANDO..." : "CARREGAR DOCUMENTOS"}
            </label>
          </div>

          {/* LISTA DE DOCUMENTOS - ESTILO UM A UM */}
          <div style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#020617' }}>Documentos Identificados no Banco:</h3>
            
            {arquivos.length === 0 && !loading && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum documento encontrado. Faça o upload acima.</div>
            )}

            <div style={{ display: 'grid', gap: '15px' }}>
              {arquivos.map((arq) => (
                <div key={arq.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '12px' }}><FileText color="#3b82f6"/></div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{arq.nome_arquivo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#020617', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>VER PDF</a>
                    <button onClick={async () => { if(confirm("Excluir?")) { await supabase.from('arquivos_processo').delete().eq('id', arq.id); carregarArquivos(); } }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ESTILOS
const btnAtivo = { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '18px', borderRadius: '12px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
const btnInativo = { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '18px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
function CheckCircle(props) { return <ShieldCheck {...props} /> }
function AlertTriangle(props) { return <AlertCircle {...props} /> }
