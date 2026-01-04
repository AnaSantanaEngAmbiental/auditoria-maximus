import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, LayoutDashboard, AlertTriangle, Bot, Sparkles, Trash2, Filter
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

export default function MaximusV50() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroPendentes, setFiltroPendentes] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarArquivos(); }, []);

  async function carregarArquivos() {
    const { data } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const nome = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      const autoAprova = DOCUMENTOS_OBRIGATORIOS.includes(nome);
      const path = `dossie/${Date.now()}_${nome}`;
      
      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: nome, url_publica: url.publicUrl, status: autoAprova ? 'Aprovado' : 'Pendente', empresa_cnpj: '38.404.019/0001-76'
        }]);
      }
    }
    carregarArquivos();
    setLoading(false);
  };

  const nomesNoBanco = arquivos.map(a => a.nome_arquivo);
  const faltantes = DOCUMENTOS_OBRIGATORIOS.filter(n => !nomesNoBanco.includes(n));
  const aprovados = arquivos.filter(a => a.status === 'Aprovado').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR AJUSTADA PARA 100% ZOOM */}
      <aside style={{ width: '300px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', margin: 0 }}>MAXIMUS <span style={{fontSize: '12px', opacity: 0.5}}>v50</span></h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>AUDITORIA AMBIENTAL BRASIL</p>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>PROGRESSO DO DOSSIÊ</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span>{aprovados} de 13 aprovados</span>
            <span style={{ color: '#10b981' }}>{Math.round((aprovados/13)*100)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(aprovados/13)*100}%`, height: '100%', backgroundColor: '#10b981', transition: '0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setFiltroPendentes(!filtroPendentes)}
            style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: filtroPendentes ? '#3b82f6' : '#334155', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
          >
            <Filter size={18}/> {filtroPendentes ? "VER TODOS" : "VER O QUE FALTA"}
          </button>
        </div>

        <button onClick={() => window.confirm("Resetar banco?") && supabase.from('arquivos_processo').delete().neq('id', '0').then(carregarArquivos)} style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', border: '1px solid #450a0a', backgroundColor: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '13px' }}>
          LIMPAR TUDO
        </button>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} size={20}/>
            <input 
              type="text" placeholder="Buscar documento..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '350px', fontSize: '16px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ padding: '12px 25px', borderRadius: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileBarChart size={20}/> RELATÓRIO
            </button>
            <label style={{ padding: '12px 25px', borderRadius: '12px', backgroundColor: '#4f46e5', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={20}/> {loading ? "CARREGANDO..." : "SUBIR ARQUIVOS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        {/* LISTAGEM INTELIGENTE */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>
                <th style={{ padding: '15px' }}>NOME DO ARQUIVO</th>
                <th style={{ padding: '15px' }}>STATUS</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>AUDITORIA</th>
              </tr>
            </thead>
            <tbody>
              {/* LISTA O QUE FALTA (Se filtro ativo) */}
              {filtroPendentes && faltantes.map(nome => (
                <tr key={nome} style={{ backgroundColor: '#fff1f2', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', color: '#e11d48', fontWeight: '600' }}>{nome}</td>
                  <td style={{ padding: '15px' }}><span style={{ color: '#e11d48', fontSize: '12px', fontWeight: '800' }}>FALTANDO NO DOSSIÊ</span></td>
                  <td style={{ padding: '15px', textAlign: 'center' }}><AlertTriangle size={18} color="#e11d48"/></td>
                </tr>
              ))}

              {/* LISTA O QUE JÁ ESTÁ NO BANCO */}
              {!filtroPendentes && arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                <tr key={arq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {arq.status === 'Aprovado' ? <Sparkles size={16} color="#f59e0b"/> : <div style={{width: 16}}/>}
                      {arq.nome_arquivo}
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', width: 'fit-content', gap: '5px' }}>
                      {arq.status === 'Aprovado' && <Bot size={14}/>} {arq.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => supabase.from('arquivos_processo').update({status: 'Aprovado'}).eq('id', arq.id).then(carregarArquivos)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#16a34a', cursor: 'pointer' }}><CheckCircle size={18}/></button>
                      <button onClick={() => supabase.from('arquivos_processo').update({status: 'Recusado'}).eq('id', arq.id).then(carregarArquivos)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}><XCircle size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {arquivos.length === 0 && !filtroPendentes && <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Dossiê vazio. Clique em carregar para iniciar.</div>}
        </div>
      </main>

      {/* RELATÓRIO MODAL */}
      {mostrarRelatorio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '700px', padding: '40px', borderRadius: '25px', position: 'relative' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer' }}><X/></button>
            <h2 style={{ margin: '0 0 20px 0' }}>Relatório de Auditoria</h2>
            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '15px', marginBottom: '20px' }}>
              <p><strong>Empresa:</strong> Cardoso & Rates (CAELI)</p>
              <p><strong>Resultado:</strong> {aprovados} de 13 Documentos Aprovados</p>
            </div>
            <button onClick={() => window.print()} style={{ width: '100%', padding: '15px', backgroundColor: '#0f172a', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>IMPRIMIR PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
