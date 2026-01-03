import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, RefreshCw, Search, ShieldCheck, 
  FileStack, Eye, XCircle, CheckCircle, FileBarChart, 
  Printer, X, LayoutDashboard, History, Settings, LogOut
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV44() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('auditoria');

  useEffect(() => { 
    carregarArquivos();
    // Refúgio: Fechar relatório com a tecla ESC
    const handleEsc = (e) => { if (e.keyCode === 27) setMostrarRelatorio(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const arquivosFiltrados = arquivos.filter(arq => arq.nome_arquivo.toLowerCase().includes(busca.toLowerCase()));

  async function alterarStatus(id, novoStatus) {
    const { error } = await supabase.from('arquivos_processo').update({ status: novoStatus }).eq('id', id);
    if (!error) await carregarArquivos();
  }

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* 1. MENU LATERAL (SISTEMA COMPLETO) */}
      <nav style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ marginBottom: '40px', padding: '0 10px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', margin: 0 }}>MAXIMUS</h1>
          <p style={{ fontSize: '12px', opacity: 0.5 }}>AUDITORIA AMBIENTAL V44</p>
        </div>
        
        <button onClick={() => setAbaAtiva('auditoria')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'auditoria' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}>
          <LayoutDashboard size={20} /> Painel de Controle
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'not-allowed', fontSize: '16px', textAlign: 'left' }}>
          <History size={20} /> Histórico de Processos
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'not-allowed', fontSize: '16px', textAlign: 'left' }}>
          <Settings size={20} /> Configurações
        </button>
        
        <div style={{ marginTop: 'auto', padding: '20px 10px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>PH</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Philipe</div>
            <div style={{ fontSize: '10px' }}>Auditor Master</div>
          </div>
        </div>
      </nav>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* TOP BAR - BUSCA E AÇÕES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} />
            <input 
              type="text" placeholder="Localizar documento no dossiê..." value={busca} onChange={(e) => setBusca(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 50px', borderRadius: '15px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ padding: '15px 25px', borderRadius: '12px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileBarChart size={20} /> GERAR RELATÓRIO FINAL
            </button>
            <input type="file" multiple onChange={(e) => {/* lógica de upload v43 */}} id="up" hidden />
            <label htmlFor="up" style={{ padding: '15px 25px', borderRadius: '12px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UploadCloud size={20} /> ADICIONAR
            </label>
          </div>
        </div>

        {/* CARDS DE STATUS RÁPIDO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Empresa Selecionada</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>CAELI TRANSPORTES</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Progresso do Dossiê</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{arquivos.length} de 13</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Aprovados</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>{arquivos.filter(a => a.status === 'Aprovado').length}</div>
          </div>
        </div>

        {/* TABELA DE GESTÃO */}
        <section style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>
                <th style={{ padding: '20px' }}>DOCUMENTO</th>
                <th style={{ padding: '20px' }}>STATUS ATUAL</th>
                <th style={{ padding: '20px', textAlign: 'center' }}>AUDITORIA</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {arquivosFiltrados.map((arq) => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc' } onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '20px', fontWeight: '600', color: '#1e293b' }}>{arq.nome_arquivo}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e' }}>
                      {arq.status || 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => alterarStatus(arq.id, 'Aprovado')} style={{ padding: '8px', border: '1px solid #bbf7d0', borderRadius: '8px', backgroundColor: '#f0fdf4', cursor: 'pointer', color: '#16a34a' }}><CheckCircle size={20}/></button>
                      <button onClick={() => alterarStatus(arq.id, 'Recusado')} style={{ padding: '8px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}><XCircle size={20}/></button>
                    </div>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>ABRIR</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {/* 3. RELATÓRIO COM OPÇÕES DE REFÚGIO (ESC, X, CLIQUE FORA) */}
      {mostrarRelatorio && (
        <div 
          onClick={() => setMostrarRelatorio(false)} // Refúgio: Clique fora para fechar
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={e => e.stopPropagation()} // Impede fechar ao clicar dentro do papel
            style={{ backgroundColor: 'white', width: '850px', maxHeight: '90vh', borderRadius: '25px', padding: '50px', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '30px', top: '30px', border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} title="Fechar (ESC)">
              <X size={24} />
            </button>
            
            <div id="print-area">
              <h2 style={{ fontSize: '32px', color: '#0f172a', marginBottom: '5px' }}>Dossiê de Conformidade Ambiental</h2>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
                <p style={{ margin: '5px 0' }}><strong>Empresa:</strong> Cardoso & Rates Transporte de Carga Ltda (CAELI)</p>
                <p style={{ margin: '5px 0' }}><strong>CNPJ:</strong> 38.404.019/0001-76</p>
                <p style={{ margin: '5px 0' }}><strong>Status:</strong> {arquivos.length === 13 ? 'CONCLUÍDO' : 'EM ANDAMENTO'}</p>
              </div>

              <table style={{ width: '100%', textAlign: 'left', fontSize: '16px' }}>
                <thead><tr style={{ borderBottom: '2px solid #0f172a' }}><th style={{padding: '10px'}}>Documento</th><th style={{padding: '10px'}}>Parecer do Auditor</th></tr></thead>
                <tbody>
                  {arquivos.map(a => (
                    <tr key={a.id}><td style={{padding: '12px', borderBottom: '1px solid #eee'}}>{a.nome_arquivo}</td><td style={{padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: a.status === 'Aprovado' ? '#16a34a' : '#dc2626'}}>{a.status || 'PENDENTE'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button onClick={() => setMostrarRelatorio(false)} style={{ padding: '15px 30px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                <button onClick={() => window.print()} style={{ padding: '15px 30px', borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Printer size={20} /> IMPRIMIR PDF
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
