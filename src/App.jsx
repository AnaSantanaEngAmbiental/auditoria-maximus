import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, RefreshCw, Search, ShieldCheck, 
  FileStack, Eye, XCircle, CheckCircle, FileBarChart, 
  Printer, X, LayoutDashboard, History, Settings, AlertCircle
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV45() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { 
    carregarArquivos();
    const fecharComEsc = (e) => { if (e.key === 'Escape') setMostrarRelatorio(false); };
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, []);

  async function carregarArquivos() {
    setLoading(true);
    const { data, error } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (!error && data) setArquivos(data);
    setLoading(false);
  }

  // LÓGICA DE AUDITORIA: Salva a decisão no banco e atualiza a lista
  async function julgarDocumento(id, decisao) {
    const { error } = await supabase.from('arquivos_processo').update({ status: decisao }).eq('id', id);
    if (!error) {
      setArquivos(prev => prev.map(a => a.id === id ? { ...a, status: decisao } : a));
    } else {
      alert("Erro ao salvar decisão no banco.");
    }
  }

  // MOTOR DE UPLOAD: Limpeza de nomes integrada para evitar Erro 400
  const executarUpload = async (e) => {
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

  const filtrados = arquivos.filter(a => a.nome_arquivo.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR OPERACIONAL */}
      <nav style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ color: '#10b981', fontSize: '24px', marginBottom: '30px' }}>MAXIMUS v45</h2>
        <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={18}/> Painel Ativo
        </div>
        <div style={{ padding: '12px', opacity: 0.5, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={18}/> Histórico
        </div>
      </nav>

      {/* ÁREA DE TRABALHO */}
      <main style={{ flex: 1, padding: '30px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={20}/>
            <input 
              type="text" placeholder="Buscar documento..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '12px 12px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '350px', fontSize: '16px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileBarChart size={20}/> RELATÓRIO
            </button>
            <input type="file" multiple onChange={executarUpload} id="up" hidden />
            <label htmlFor="up" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={20}/> {loading ? "ENVIANDO..." : "CARREGAR"}
            </label>
          </div>
        </header>

        {/* TABELA DE AUDITORIA */}
        <div style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '20px' }}>DOCUMENTO</th>
                <th style={{ padding: '20px' }}>STATUS</th>
                <th style={{ padding: '20px', textAlign: 'center' }}>DECISÃO</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(arq => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px', fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>{arq.nome_arquivo}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      {arq.status?.toUpperCase() || 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => julgarDocumento(arq.id, 'Aprovado')} style={{ padding: '8px', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }}><CheckCircle size={20}/></button>
                      <button onClick={() => julgarDocumento(arq.id, 'Recusado')} style={{ padding: '8px', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', cursor: 'pointer' }}><XCircle size={20}/></button>
                    </div>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>ABRIR</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DE RELATÓRIO (COM REFÚGIOS) */}
      {mostrarRelatorio && (
        <div onClick={() => setMostrarRelatorio(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '800px', padding: '40px', borderRadius: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'none', cursor: 'pointer' }}><X size={30}/></button>
            
            <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Relatório de Conformidade</h2>
            <p><strong>Empresa:</strong> CAELI TRANSPORTES (38.404.019/0001-76)</p>
            <p><strong>Total:</strong> {arquivos.length} arquivos</p>
            
            <table style={{ width: '100%', marginTop: '20px' }}>
              <thead style={{ borderBottom: '2px solid black' }}><tr><th align="left">Arquivo</th><th align="right">Status</th></tr></thead>
              <tbody>
                {arquivos.map(a => (
                  <tr key={a.id}><td style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>{a.nome_arquivo}</td><td align="right" style={{ fontWeight: 'bold', color: a.status === 'Aprovado' ? 'green' : 'red' }}>{a.status}</td></tr>
                ))}
              </tbody>
            </table>
            
            <button onClick={() => window.print()} style={{ marginTop: '30px', width: '100%', padding: '15px', backgroundColor: '#0f172a', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <Printer size={20}/> IMPRIMIR DOCUMENTO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
