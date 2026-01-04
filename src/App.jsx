import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, Bot, Sparkles, Trash2, ShieldCheck, Eye
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

export default function MaximusV51() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const handleUploadInteligente = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      const statusAuto = DOCUMENTOS_OBRIGATORIOS.includes(nomeLimpo) ? 'Aprovado' : 'Pendente';
      const path = `dossie/${Date.now()}_${nomeLimpo}`;

      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: nomeLimpo, url_publica: url.publicUrl, status: statusAuto, empresa_cnpj: '38.404.019/0001-76'
        }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  const aprovadosCount = arquivos.filter(a => a.status === 'Aprovado').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR PREMIUM (Inspirada na v42) */}
      <aside style={{ width: '320px', backgroundColor: '#1e293b', padding: '40px 30px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', letterSpacing: '-1px', margin: 0 }}>MAXIMUS</h1>
          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Auditoria Caeli Transportes</p>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #334155' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '15px' }}>CONFORMIDADE DO PROCESSO</p>
          <div style={{ fontSize: '36px', fontWeight: '900', color: aprovadosCount === 13 ? '#10b981' : '#f8fafc' }}>
            {aprovadosCount}<span style={{ fontSize: '18px', color: '#475569' }}> / 13</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' }}>
            <div style={{ width: `${(aprovadosCount/13)*100}%`, height: '100%', backgroundColor: '#10b981', transition: '0.5s ease' }} />
          </div>
        </div>

        {aprovadosCount === 13 && (
          <div style={{ backgroundColor: '#064e3b', color: '#10b981', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 'bold' }}>
            <ShieldCheck size={20}/> DOSSIÊ PRONTO PARA ENVIO
          </div>
        )}

        <button 
          onClick={() => window.confirm("Deseja resetar o sistema?") && supabase.from('arquivos_processo').delete().neq('id', '0').then(carregarArquivos)}
          style={{ marginTop: 'auto', background: 'none', border: '1px solid #334155', color: '#64748b', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
        >
          <Trash2 size={16}/> RESETAR SISTEMA
        </button>
      </aside>

      {/* PAINEL DE CONTROLE */}
      <main style={{ flex: 1, padding: '50px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '15px', color: '#475569' }} size={20}/>
            <input 
              type="text" placeholder="Localizar no banco de dados..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '15px 20px 15px 55px', borderRadius: '15px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', width: '400px', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '15px 30px', borderRadius: '15px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileBarChart size={20}/> GERAR RELATÓRIO
            </button>
            <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '15px 30px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UploadCloud size={20}/> {loading ? "ROBÔ PROCESSANDO..." : "SUBIR ARQUIVOS"}
              <input type="file" multiple onChange={handleUploadInteligente} hidden />
            </label>
          </div>
        </header>

        {/* TABELA DE AUDITORIA */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '25px', padding: '30px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Documento Identificado</th>
                <th style={{ padding: '20px' }}>Status da I.A</th>
                <th style={{ padding: '20px', textAlign: 'center' }}>Ação Manual</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '20px', fontWeight: '600', color: '#f8fafc', fontSize: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {arq.status === 'Aprovado' ? <Sparkles size={18} color="#f59e0b"/> : <div style={{width: 18}}/>}
                      {arq.nome_arquivo}
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', backgroundColor: arq.status === 'Aprovado' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: arq.status === 'Aprovado' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                      {arq.status === 'Aprovado' ? <Bot size={14}/> : <XCircle size={14}/>}
                      {arq.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#334155', color: '#f8fafc' }}><Eye size={18}/></a>
                      <button onClick={() => supabase.from('arquivos_processo').update({status: 'Aprovado'}).eq('id', arq.id).then(carregarArquivos)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #10b981', color: '#10b981', background: 'none', cursor: 'pointer' }}><CheckCircle size={18}/></button>
                      <button onClick={() => supabase.from('arquivos_processo').update({status: 'Recusado'}).eq('id', arq.id).then(carregarArquivos)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ef4444', color: '#ef4444', background: 'none', cursor: 'pointer' }}><XCircle size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {arquivos.length === 0 && <div style={{ padding: '80px', textAlign: 'center', color: '#475569', fontSize: '18px' }}>Sistema aguardando upload dos documentos da Caeli...</div>}
        </div>
      </main>

      {/* RELATÓRIO MODAL PREMIUM */}
      {mostrarRelatorio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
          <div style={{ backgroundColor: 'white', color: '#0f172a', width: '800px', padding: '50px', borderRadius: '30px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '900' }}>Relatório de Conformidade</h2>
              <button onClick={() => setMostrarRelatorio(false)} style={{ border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X/></button>
            </div>
            <div style={{ padding: '30px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <p style={{ margin: '5px 0' }}><strong>Empresa:</strong> Cardoso & Rates Transporte de Carga Ltda (CAELI)</p>
              <p style={{ margin: '5px 0' }}><strong>Processo:</strong> Auditoria Ambiental SEMAS 2026</p>
              <p style={{ margin: '5px 0' }}><strong>Resultado:</strong> {aprovadosCount} de 13 Documentos Confirmados</p>
            </div>
            <button onClick={() => window.print()} style={{ width: '100%', padding: '20px', backgroundColor: '#0f172a', color: 'white', borderRadius: '15px', fontSize: '18px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <Printer size={22}/> IMPRIMIR DOSSIÊ FINAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
