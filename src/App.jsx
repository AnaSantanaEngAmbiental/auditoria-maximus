import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, LayoutDashboard, AlertTriangle, Bot, Sparkles, Trash2, Check
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

export default function MaximusV49() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  async function limparSistema() {
    if(confirm("Deseja zerar todo o dossiê atual?")) {
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      carregarArquivos();
    }
  }

  const executarUploadInteligente = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      const aprovadoAuto = DOCUMENTOS_OBRIGATORIOS.includes(nomeLimpo);
      
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);

      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: '38.404.019/0001-76', 
          nome_arquivo: nomeLimpo, 
          url_publica: url.publicUrl,
          status: aprovadoAuto ? 'Aprovado' : 'Pendente'
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };

  const aprovados = arquivos.filter(a => a.status === 'Aprovado').length;
  const porcentagem = Math.round((aprovados / 13) * 100);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif', fontSize: '20px' }}>
      
      {/* SIDEBAR DE ALTA VISIBILIDADE */}
      <nav style={{ width: '380px', backgroundColor: '#0f172a', color: 'white', padding: '60px 40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#10b981', margin: 0 }}>MAXIMUS</h1>
        
        <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '25px', borderLeft: '10px solid #10b981' }}>
          <p style={{ fontSize: '14px', opacity: 0.5, marginBottom: '10px' }}>STATUS DO DOSSIÊ</p>
          <h2 style={{ fontSize: '28px', margin: 0 }}>{porcentagem}% Concluído</h2>
          <div style={{ width: '100%', height: '12px', backgroundColor: '#334155', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' }}>
            <div style={{ width: `${porcentagem}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <button onClick={limparSistema} style={{ marginTop: 'auto', padding: '20px', backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #991b1b', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trash2 size={24}/> RESETAR TUDO
        </button>
      </nav>

      {/* ÁREA DE TRABALHO AMPLIADA */}
      <main style={{ flex: 1, padding: '60px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '25px', top: '25px', color: '#94a3b8' }} size={30}/>
            <input 
              type="text" placeholder="Pesquisar no banco..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '25px 30px 25px 75px', borderRadius: '25px', border: '3px solid #cbd5e1', width: '550px', fontSize: '24px', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '25px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', padding: '25px 45px', borderRadius: '25px', fontWeight: '900', fontSize: '24px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FileBarChart size={32}/> RELATÓRIO
            </button>
            <input type="file" multiple onChange={executarUploadInteligente} id="up" hidden />
            <label htmlFor="up" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '25px 45px', borderRadius: '25px', fontWeight: '900', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <UploadCloud size={32}/> {loading ? "ROBÔ AGUARDE..." : "CARREGAR"}
            </label>
          </div>
        </header>

        {/* TABELA DE DADOS GIGANTE */}
        <div style={{ backgroundColor: 'white', borderRadius: '40px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ borderBottom: '4px solid #f1f5f9' }}>
              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '22px' }}>
                <th style={{ padding: '30px' }}>ARQUIVO</th>
                <th style={{ padding: '30px' }}>STATUS</th>
                <th style={{ padding: '30px', textAlign: 'center' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '30px', fontWeight: 'bold', fontSize: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {arq.status === 'Aprovado' ? <Sparkles color="#f59e0b" /> : <div style={{width: 24}}/>}
                      {arq.nome_arquivo}
                    </div>
                  </td>
                  <td style={{ padding: '30px' }}>
                    <span style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '18px', fontWeight: '900', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', width: 'fit-content', gap: '10px' }}>
                      {arq.status === 'Aprovado' ? <Bot size={20}/> : <AlertTriangle size={20}/>}
                      {arq.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '30px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                      <button onClick={() => carregarArquivos()} style={{ padding: '15px', borderRadius: '15px', border: '2px solid #e2e8f0', cursor: 'pointer' }}><Check size={28}/></button>
                      <button onClick={() => carregarArquivos()} style={{ padding: '15px', borderRadius: '15px', border: '2px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}><X size={28}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {arquivos.length === 0 && <div style={{ padding: '100px', textAlign: 'center', fontSize: '30px', color: '#cbd5e1' }}>Aguardando upload dos 13 arquivos...</div>}
        </div>
      </main>

      {/* MODAL DE IMPRESSÃO */}
      {mostrarRelatorio && (
        <div onClick={() => setMostrarRelatorio(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '1000px', padding: '80px', borderRadius: '50px' }}>
            <h2 style={{ fontSize: '50px', marginBottom: '20px' }}>Dossiê Finalizado</h2>
            <div style={{ fontSize: '26px', border: '3px solid #f1f5f9', padding: '40px', borderRadius: '30px', marginBottom: '40px' }}>
              <p><strong>Empresa:</strong> Caeli Transportes</p>
              <p><strong>Conformidade:</strong> {aprovados}/13 Aprovados</p>
            </div>
            <button onClick={() => window.print()} style={{ width: '100%', padding: '30px', backgroundColor: '#0f172a', color: 'white', borderRadius: '25px', fontSize: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
              IMPRIMIR PARA SEMAS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
