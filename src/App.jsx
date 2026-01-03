import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, RefreshCw, Search, ShieldCheck, 
  FileStack, Eye, XCircle, CheckCircle, FileBarChart, Printer, X 
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV43() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

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

  return (
    <div style={{ padding: '40px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER GIGANTE E LIMPO */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '30px 50px', borderRadius: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: '800' }}>MAXIMUS v43</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '22px' }}>Gestão Caeli Transportes</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
            <FileBarChart size={24} /> VER RELATÓRIO
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '40px' }}>
        
        {/* COLUNA DE CONTROLE ESQUERDA */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>Filtro de Busca</h3>
            <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#64748b' }} />
                <input 
                type="text" placeholder="Ex: oficio..." value={busca} onChange={(e) => setBusca(e.target.value)}
                style={{ padding: '15px 15px 15px 50px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '20px', width: '100%', outline: 'none' }}
                />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px' }}>Status Final</h3>
            <div style={{ fontSize: '60px', fontWeight: '900', color: '#0f172a' }}>{arquivos.length}/13</div>
            <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '20px', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' }}>
              <div style={{ width: `${(arquivos.length / 13) * 100}%`, backgroundColor: '#3b82f6', height: '100%', transition: '1s ease-in-out' }}></div>
            </div>
          </div>
        </aside>

        {/* TABELA COM EFEITO DE APROXIMAÇÃO (HOVER) */}
        <main style={{ backgroundColor: 'white', borderRadius: '25px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '3px solid #e2e8f0' }}>
              <tr style={{ textAlign: 'left', fontSize: '22px' }}>
                <th style={{ padding: '25px' }}>Documento</th>
                <th style={{ padding: '25px' }}>Auditoria</th>
                <th style={{ padding: '25px' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {arquivosFiltrados.map((arq) => (
                <tr 
                  key={arq.id} 
                  style={{ transition: 'transform 0.2s, box-shadow 0.2s', borderBottom: '1px solid #f1f5f9' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'scale(1.01)'; // EFEITO DE APROXIMAR
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{ padding: '25px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{arq.nome_arquivo}</div>
                    <span style={{ 
                      padding: '5px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'inline-block', marginTop: '10px',
                      backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : arq.status === 'Recusado' ? '#fee2e2' : '#fef3c7',
                      color: arq.status === 'Aprovado' ? '#166534' : arq.status === 'Recusado' ? '#991b1b' : '#92400e'
                    }}>
                      {arq.status?.toUpperCase() || 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => alterarStatus(arq.id, 'Aprovado')} style={{ padding: '15px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', cursor: 'pointer', color: '#16a34a' }}><CheckCircle size={30} /></button>
                      <button onClick={() => alterarStatus(arq.id, 'Recusado')} style={{ padding: '15px', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', cursor: 'pointer', color: '#dc2626' }}><XCircle size={30} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '25px' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ background: '#0f172a', color: 'white', padding: '15px 30px', borderRadius: '12px', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>ABRIR PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>

      {/* JANELA DE RELATÓRIO (MODAL) */}
      {mostrarRelatorio && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '80%', maxHeight: '80%', borderRadius: '25px', padding: '40px', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '30px', top: '30px', border: 'none', background: 'none', cursor: 'pointer' }}><X size={40} /></button>
            
            <h2 style={{ fontSize: '32px', borderBottom: '3px solid #0f172a', paddingBottom: '10px' }}>Relatório de Auditoria Ambiental</h2>
            <div style={{ marginTop: '20px', fontSize: '22px' }}>
                <p><strong>Empresa:</strong> CAELI TRANSPORTES</p>
                <p><strong>Total de Documentos:</strong> {arquivos.length}</p>
                <p><strong>Aprovados:</strong> {arquivos.filter(a => a.status === 'Aprovado').length}</p>
                <hr />
                <table style={{ width: '100%', textAlign: 'left', marginTop: '20px' }}>
                    <thead><tr><th style={{padding: '10px'}}>Documento</th><th style={{padding: '10px'}}>Status</th></tr></thead>
                    <tbody>
                        {arquivos.map(a => (
                            <tr key={a.id}><td style={{padding: '10px', borderBottom: '1px solid #eee'}}>{a.nome_arquivo}</td><td style={{padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: a.status === 'Aprovado' ? 'green' : 'red'}}>{a.status || 'PENDENTE'}</td></tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={() => window.print()} style={{ marginTop: '30px', padding: '15px 40px', backgroundColor: '#0f172a', color: 'white', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Printer /> IMPRIMIR RELATÓRIO
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
