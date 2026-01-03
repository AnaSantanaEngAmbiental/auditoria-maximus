import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, LayoutDashboard, AlertTriangle, FileCheck, Bot, Sparkles, Trash2
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

export default function MaximusV48() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  // AUTOMATIZAÇÃO DE LIMPEZA (NOVO)
  async function limparDossie() {
    if(window.confirm("Deseja apagar todos os documentos e resetar o dossiê?")) {
      const { error } = await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) carregarArquivos();
    }
  }

  const handleUploadAutomatico = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
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
    <div style={{ display: 'flex', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* SIDEBAR - TEXTOS AMPLIADOS */}
      <nav style={{ width: '350px', backgroundColor: '#0f172a', color: 'white', padding: '50px 30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: '#10b981', fontSize: '42px', fontWeight: '900', marginBottom: '5px' }}>MAXIMUS</h1>
        <p style={{ fontSize: '14px', color: '#6366f1', letterSpacing: '2px', marginBottom: '50px' }}>CONTROLE DE AUDITORIA V48</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '25px', backgroundColor: '#1e293b', borderRadius: '20px', borderLeft: '8px solid #3b82f6' }}>
                <span style={{ fontSize: '14px', opacity: 0.6, textTransform: 'uppercase' }}>Empresa Atual</span>
                <h2 style={{ fontSize: '24px', margin: '5px 0' }}>CAELI TRANSP.</h2>
            </div>
            
            <div style={{ padding: '25px', backgroundColor: documentosFaltantes.length === 0 ? '#064e3b' : '#450a0a', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: 'bold' }}>
                    <AlertTriangle size={28}/> {documentosFaltantes.length === 0 ? "PRONTO" : "FALTANDO"}
                </div>
                <p style={{ fontSize: '18px', marginTop: '10px' }}>{documentosFaltantes.length} itens pendentes.</p>
            </div>

            <button onClick={limparDossie} style={{ marginTop: 'auto', backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '20px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' }}>
              <Trash2 size={20}/> RESETAR SISTEMA
            </button>
        </div>
      </nav>

      {/* PAINEL CENTRAL - FONTE MÁXIMA */}
      <main style={{ flex: 1, padding: '60px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '25px', top: '22px', color: '#94a3b8' }} size={30}/>
            <input 
              type="text" placeholder="Localizar arquivo..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '25px 25px 25px 75px', borderRadius: '25px', border: '3px solid #cbd5e1', width: '500px', fontSize: '26px', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '25px 45px', borderRadius: '25px', fontWeight: '900', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 20px rgba(16,185,129,0.3)' }}>
              <FileBarChart size={32}/> RELATÓRIO
            </button>
            <input type="file" multiple onChange={handleUploadAutomatico} id="autoup" hidden />
            <label htmlFor="autoup" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '25px 45px', borderRadius: '25px', fontWeight: '900', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <UploadCloud size={32}/> {loading ? "PROCESSANDO..." : "CARREGAR"}
            </label>
          </div>
        </header>

        {/* TABELA DE GESTÃO - LETRAS GRANDES */}
        <div style={{ backgroundColor: 'white', borderRadius: '40px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '4px solid #f1f5f9', color: '#475569', fontSize: '24px' }}>
                <th style={{ padding: '30px' }}>DOCUMENTO</th>
                <th style={{ padding: '30px' }}>STATUS</th>
                <th style={{ padding: '30px', textAlign: 'center' }}>AUDITORIA</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.filter(a => a.nome_arquivo.toLowerCase().includes(busca.toLowerCase())).map(arq => (
                <tr key={arq.id} style={{ borderBottom: '2px solid #f8fafc', fontSize: '24px' }}>
                  <td style={{ padding: '30px', fontWeight: '700', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {arq.status === 'Aprovado' ? <Sparkles size={24} color="#f59e0b" /> : <FileCheck size={24} color="#cbd5e1"/>}
                        {arq.nome_arquivo}
                    </div>
                  </td>
                  <td style={{ padding: '30px' }}>
                    <span style={{ padding: '10px 20px', borderRadius: '15px', fontSize: '18px', fontWeight: '900', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {arq.status === 'Aprovado' && <Bot size={20}/>} {arq.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                      <button onClick={() => julgar(arq.id, 'Aprovado')} style={{ padding: '15px', borderRadius: '18px', border: '3px solid #bbf7d0', color: '#16a34a', cursor: 'pointer', backgroundColor: '#f0fdf4' }} title="Aprovar Manulamente"><CheckCircle size={32}/></button>
                      <button onClick={() => julgar(arq.id, 'Recusado')} style={{ padding: '15px', borderRadius: '18px', border: '3px solid #fecaca', color: '#dc2626', cursor: 'pointer', backgroundColor: '#fef2f2' }} title="Recusar Documento"><XCircle size={32}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {arquivos.length === 0 && <div style={{textAlign: 'center', padding: '100px', fontSize: '28px', color: '#94a3b8'}}>Nenhum arquivo no dossiê. Aguardando upload...</div>}
        </div>
      </main>

      {/* RELATÓRIO FINAL - VISIBILIDADE DE IMPRESSÃO */}
      {mostrarRelatorio && (
        <div onClick={() => setMostrarRelatorio(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '1000px', padding: '70px', borderRadius: '50px', position: 'relative' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', right: '40px', top: '40px', border: 'none', background: '#f1f5f9', padding: '20px', borderRadius: '50%', cursor: 'pointer' }}><X size={40}/></button>
            <h2 style={{ fontSize: '50px', fontWeight: '900', color: '#0f172a' }}>Dossiê de Conformidade</h2>
            <p style={{ fontSize: '26px', color: '#64748b', marginBottom: '40px' }}>Unidade: Marabá/PA — Caeli Transportes</p>
            
            <div style={{ maxHeight: '450px', overflowY: 'auto', border: '2px solid #f1f5f9', padding: '30px', borderRadius: '25px' }}>
                {arquivos.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid #f1f5f9', fontSize: '22px' }}>
                        <span style={{fontWeight: '500'}}>{a.nome_arquivo}</span>
                        <strong style={{ color: a.status === 'Aprovado' ? '#16a34a' : '#dc2626' }}>{a.status?.toUpperCase()}</strong>
                    </div>
                ))}
            </div>
            
            <button onClick={() => window.print()} style={{ marginTop: '50px', width: '100%', padding: '30px', backgroundColor: '#0f172a', color: 'white', borderRadius: '25px', fontWeight: '900', fontSize: '28px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <Printer size={38}/> IMPRIMIR PDF FINAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
