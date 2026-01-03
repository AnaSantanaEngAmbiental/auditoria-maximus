import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, LayoutDashboard, AlertTriangle, FileCheck, Bot, Sparkles
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOCUMENTOS_OBRIGATORIOS = [
  "processo_caeli_transportes_semas_lo.pdf", "planilha_atualizada_caeli_julho_2025.pdf",
  "planilha_atualizada_caeli_julho_2025.docx", "lo_15793_2025_cardoso_e_prates.pdf",
  "5.2_ctpp___carreta_2_tvo9d17.pdf", "5.1_ctpp___carreta_1_tvo9d07.pdf",
  "4.2_nf_carreta_2_tvo9d17.pdf", "4.1_nf_carreta_1_tvo9d07.pdf",
  "3.2_crlv_carreta_2_tvo9d17.pdf", "3.1_crlv_carreta_1_tvo9d07.pdf",
  "2_dia_caeli_2025.pdf", "1_requerimento_padrao_semas_pa_2025.pdf", "0___oficio.pdf"
];

export default function MaximusV47() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  // AUTOMAÇÃO: Função que decide o status no momento do upload
  const handleUploadAutomatico = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      
      // Regra de Automação: Se o nome estiver na lista oficial, aprova na hora!
      const statusAutomatico = DOCUMENTOS_OBRIGATORIOS.includes(nomeLimpo) ? 'Aprovado' : 'Pendente';
      
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!storageError) {
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: '38.404.019/0001-76', 
          nome_arquivo: nomeLimpo, 
          url_publica: urlData.publicUrl,
          status: statusAutomatico 
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  async function julgar(id, status) {
    await supabase.from('arquivos_processo').update({ status }).eq('id', id);
    carregarArquivos();
  }

  const nomesPresentes = arquivos.map(a => a.nome_arquivo);
  const documentosFaltantes = DOCUMENTOS_OBRIGATORIOS.filter(nome => !nomesPresentes.includes(nome));

  return (
    <div style={{ display: 'flex', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial, sans-serif', fontSize: '18px' }}>
      
      {/* SIDEBAR AMPLIADA */}
      <nav style={{ width: '320px', backgroundColor: '#111827', color: 'white', padding: '40px 25px' }}>
        <h1 style={{ color: '#10b981', fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>MAXIMUS</h1>
        <div style={{ fontSize: '14px', color: '#6366f1', fontWeight: 'bold', marginBottom: '40px' }}>MODO AUTOMAÇÃO ATIVO <Bot size={14} style={{marginLeft: 5}}/></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '20px', backgroundColor: '#1f2937', borderRadius: '15px', borderLeft: '5px solid #10b981' }}>
                <h3 style={{ fontSize: '20px', margin: 0 }}>Dossiê Caeli</h3>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>Progresso: {arquivos.length}/13</p>
            </div>
            
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: documentosFaltantes.length === 0 ? '#064e3b' : '#450a0a', borderRadius: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                    <AlertTriangle size={24}/> {documentosFaltantes.length === 0 ? "CONCLUÍDO" : "PENDÊNCIAS"}
                </div>
                <p style={{ fontSize: '16px', marginTop: '10px' }}>{documentosFaltantes.length} documentos faltam para o envio.</p>
            </div>
        </div>
      </nav>

      {/* PAINEL DE CONTROLE GIGANTE */}
      <main style={{ flex: 1, padding: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '22px', color: '#94a3b8' }} size={24}/>
            <input 
              type="text" placeholder="Pesquisar documento..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '20px 20px 20px 60px', borderRadius: '20px', border: '2px solid #cbd5e1', width: '450px', fontSize: '22px', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '20px 40px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 15px rgba(16,185,129,0.3)' }}>
              <FileBarChart size={28}/> RELATÓRIO
            </button>
            <input type="file" multiple onChange={handleUploadAutomatico} id="autoup" hidden />
            <label htmlFor="autoup" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '20px 40px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UploadCloud size={28}/> {loading ? "ROBÔ CARREGANDO..." : "SUBIR TUDO"}
            </label>
          </div>
        </div>

        {/* ÁREA DE TRABALHO COM FONTE GRANDE */}
        <div style={{ backgroundColor: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '3px solid #f1f5f9', color: '#475569', fontSize: '20px' }}>
                <th style={{ padding: '25px' }}>DOCUMENTO</th>
                <th style={{ padding: '25px' }}>STATUS</th>
                <th style={{ padding: '25px', textAlign: 'center' }}>AUDITORIA</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '20px' }}>
                  <td style={{ padding: '25px', fontWeight: '700', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {DOCUMENTOS_OBRIGATORIOS.includes(arq.nome_arquivo) && <Sparkles size={18} color="#f59e0b" />}
                        {arq.nome_arquivo}
                    </div>
                  </td>
                  <td style={{ padding: '25px' }}>
                    <span style={{ padding: '8px 15px', borderRadius: '10px', fontSize: '16px', fontWeight: '900', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {arq.status === 'Aprovado' && <Bot size={14}/>} {arq.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                      <button onClick={() => julgar(arq.id, 'Aprovado')} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #bbf7d0', color: '#16a34a', cursor: 'pointer', backgroundColor: '#f0fdf4' }}><CheckCircle size={28}/></button>
                      <button onClick={() => julgar(arq.id, 'Recusado')} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #fecaca', color: '#dc2626', cursor: 'pointer', backgroundColor: '#fef2f2' }}><XCircle size={28}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* RELATÓRIO FINAL AMPLIADO */}
      {mostrarRelatorio && (
        <div onClick={() => setMostrarRelatorio(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '900px', padding: '60px', borderRadius: '40px', position: 'relative', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '40px', top: '40px', border: 'none', background: '#f1f5f9', padding: '15px', borderRadius: '50%', cursor: 'pointer' }}><X size={32}/></button>
            <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '10px', color: '#0f172a' }}>Relatório de Auditoria</h2>
            <p style={{ fontSize: '22px', color: '#64748b' }}>Empresa: Cardoso & Rates (CAELI)</p>
            <div style={{ margin: '40px 0', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '20px', fontSize: '24px' }}>
                <p><strong>Total de Documentos:</strong> {arquivos.length}</p>
                <p><strong>Aprovação por Robô:</strong> {arquivos.filter(a => a.status === 'Aprovado').length}</p>
            </div>
            <button onClick={() => window.print()} style={{ width: '100%', padding: '25px', backgroundColor: '#0f172a', color: 'white', borderRadius: '20px', fontWeight: '900', fontSize: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <Printer size={32}/> IMPRIMIR PARA SEMAS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
