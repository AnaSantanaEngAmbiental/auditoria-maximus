import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, LayoutDashboard, History, AlertTriangle, FileCheck 
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// A MEMÓRIA DO SISTEMA: Os 13 documentos que você aprovou anteriormente
const DOCUMENTOS_OBRIGATORIOS = [
  "processo_caeli_transportes_semas_lo.pdf",
  "planilha_atualizada_caeli_julho_2025.pdf",
  "planilha_atualizada_caeli_julho_2025.docx",
  "lo_15793_2025_cardoso_e_prates.pdf",
  "5.2_ctpp___carreta_2_tvo9d17.pdf",
  "5.1_ctpp___carreta_1_tvo9d07.pdf",
  "4.2_nf_carreta_2_tvo9d17.pdf",
  "4.1_nf_carreta_1_tvo9d07.pdf",
  "3.2_crlv_carreta_2_tvo9d17.pdf",
  "3.1_crlv_carreta_1_tvo9d07.pdf",
  "2_dia_caeli_2025.pdf",
  "1_requerimento_padrao_semas_pa_2025.pdf",
  "0___oficio.pdf"
];

export default function MaximusV46() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { 
    carregarArquivos();
    const esc = (e) => e.key === 'Escape' && setMostrarRelatorio(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  async function julgar(id, status) {
    const { error } = await supabase.from('arquivos_processo').update({ status }).eq('id', id);
    if (!error) carregarArquivos();
  }

  // Lógica de Checklist: Identifica o que falta
  const nomesPresentes = arquivos.map(a => a.nome_arquivo);
  const documentosFaltantes = DOCUMENTOS_OBRIGATORIOS.filter(nome => !nomesPresentes.includes(nome));

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* MENU LATERAL */}
      <nav style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px' }}>
        <h1 style={{ color: '#10b981', fontSize: '28px', marginBottom: '5px' }}>MAXIMUS</h1>
        <p style={{ opacity: 0.5, fontSize: '12px', marginBottom: '40px' }}>SISTEMA DE AUDITORIA V46</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={20}/> Painel de Controle
          </div>
          
          {/* Alerta de Pendência na Sidebar */}
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: documentosFaltantes.length > 0 ? '#450a0a' : '#064e3b', borderRadius: '12px', border: '1px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <AlertTriangle size={18} color={documentosFaltantes.length > 0 ? '#ef4444' : '#10b981'}/> 
              CHECKLIST
            </div>
            <p style={{ fontSize: '13px', marginTop: '5px' }}>
              {documentosFaltantes.length > 0 
                ? `Faltam ${documentosFaltantes.length} documentos obrigatórios.` 
                : "Dossiê 100% Completo!"}
            </p>
          </div>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }}/>
            <input 
              type="text" placeholder="Filtrar documentos carregados..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '15px 15px 15px 50px', borderRadius: '15px', border: '1px solid #e2e8f0', width: '400px', fontSize: '16px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileBarChart size={22}/> RELATÓRIO FINAL
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
          
          {/* TABELA DE ARQUIVOS CARREGADOS */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileCheck color="#3b82f6"/> Documentos no Banco ({arquivos.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>NOME DO ARQUIVO</th>
                  <th style={{ padding: '15px' }}>STATUS</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>AUDITORIA</th>
                </tr>
              </thead>
              <tbody>
                {arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                  <tr key={arq.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontWeight: '600', color: '#1e293b' }}>{arq.nome_arquivo}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e' }}>
                        {arq.status?.toUpperCase() || 'PENDENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => julgar(arq.id, 'Aprovado')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#16a34a', cursor: 'pointer' }}><CheckCircle size={18}/></button>
                        <button onClick={() => julgar(arq.id, 'Recusado')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}><XCircle size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CHECKLIST DE PENDÊNCIAS (LADO DIREITO) */}
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>O que falta subir?</h4>
            {documentosFaltantes.length === 0 ? (
              <div style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>✓ Tudo carregado!</div>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {documentosFaltantes.map(doc => (
                  <li key={doc} style={{ fontSize: '12px', padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                    {doc}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </main>

      {/* RELATÓRIO (MODAL COM FECHAMENTO INTELIGENTE) */}
      {mostrarRelatorio && (
        <div onClick={() => setMostrarRelatorio(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '800px', padding: '50px', borderRadius: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '30px', top: '30px', border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X/></button>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Relatório Master</h2>
            <p><strong>Caeli Transportes</strong> - Auditoria Finalizada</p>
            <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }}/>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {arquivos.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                        <span>{a.nome_arquivo}</span>
                        <strong style={{ color: a.status === 'Aprovado' ? 'green' : 'red' }}>{a.status}</strong>
                    </div>
                ))}
            </div>
            <button onClick={() => window.print()} style={{ marginTop: '40px', width: '100%', padding: '18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Printer/> IMPRIMIR AGORA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
