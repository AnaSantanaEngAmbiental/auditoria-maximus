import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, Bot, Sparkles, Trash2, ShieldCheck, Eye, Edit3, Truck, LayoutGrid
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

export default function MaximusV52() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('dossie');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    if (veiculos) setFrota(veiculos);
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const nomeLimpo = file.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "_");
      const autoAprovado = DOCUMENTOS_OBRIGATORIOS.includes(nomeLimpo);
      const path = `dossie/${Date.now()}_${nomeLimpo}`;

      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: nomeLimpo, url_publica: url.publicUrl, status: autoAprovado ? 'Aprovado' : 'Pendente', empresa_cnpj: '38.404.019/0001-76'
        }]);
      }
    }
    carregarDados();
    setLoading(false);
  };

  const aprovados = arquivos.filter(a => a.status === 'Aprovado').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR DARK */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginBottom: '5px' }}>MAXIMUS</h1>
        <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '40px' }}>CONTROLE DE AUDITORIA V5.2</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
          <button onClick={() => setAbaAtiva('dossie')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'dossie' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
            <LayoutGrid size={18} /> DOSSIÊ AMBIENTAL
          </button>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
            <Truck size={18} /> AUDITORIA DE FROTA
          </button>
        </nav>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>STATUS DO DOSSIÊ</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{aprovados} / 13</div>
          <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${(aprovados/13)*100}%`, height: '100%', backgroundColor: '#10b981', transition: '0.5s' }} />
          </div>
        </div>

        <button onClick={() => window.confirm("Resetar?") && supabase.from('arquivos_processo').delete().neq('id', '0').then(carregarDados)} 
          style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>
          <Trash2 size={14} style={{ marginRight: '8px' }}/> RESETAR SISTEMA
        </button>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} size={20}/>
            <input 
              type="text" placeholder="Localizar registro..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileBarChart size={20}/> RELATÓRIO
            </button>
            <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={20}/> {loading ? "SUBINDO..." : "CARREGAR"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'dossie' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '15px' }}>DOCUMENTO</th>
                  <th style={{ padding: '15px' }}>STATUS</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>AUDITORIA</th>
                </tr>
              </thead>
              <tbody>
                {arquivos.filter(a => a.nome_arquivo.includes(busca)).map(arq => (
                  <tr key={arq.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontSize: '14px', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {arq.status === 'Aprovado' && <Sparkles size={14} color="#f59e0b"/>}
                        {arq.nome_arquivo}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: arq.status === 'Aprovado' ? '#dcfce7' : '#fef3c7', color: arq.status === 'Aprovado' ? '#166534' : '#92400e' }}>
                        {arq.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569' }}><Eye size={16}/></a>
                        <button onClick={() => supabase.from('arquivos_processo').update({status: 'Aprovado'}).eq('id', arq.id).then(carregarDados)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #10b981', color: '#10b981', background: 'none', cursor: 'pointer' }}><CheckCircle size={16}/></button>
                        <button onClick={() => supabase.from('arquivos_processo').update({status: 'Pendente'}).eq('id', arq.id).then(carregarDados)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', background: 'none', cursor: 'pointer' }}><XCircle size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* NOVA TABELA DE FROTA */
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '15px' }}>STATUS</th>
                  <th style={{ padding: '15px' }}>PLACA / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>VÍNCULO PDF</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => {
                  const temDoc = arquivos.some(a => a.nome_arquivo.includes(v.placa.toLowerCase()));
                  const vencido = v.validade_civ && new Date(v.validade_civ) < new Date();
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: vencido ? '#fee2e2' : '#dcfce7', color: vencido ? '#b91c1c' : '#166534' }}>
                          {vencido ? 'VENCIDO' : 'REGULAR'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 'bold' }}>{v.placa}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{v.motorista}</div>
                      </td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#475569' }}>{v.validade_civ || 'N/A'}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {temDoc ? <CheckCircle size={18} color="#10b981"/> : <XCircle size={18} color="#94a3b8"/>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* RELATÓRIO MODAL */}
      {mostrarRelatorio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', borderRadius: '12px', position: 'relative' }}>
            <button onClick={() => setMostrarRelatorio(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer' }}><X size={24}/></button>
            <div id="print-area">
              <h2 style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '20px' }}>Dossiê e Auditoria de Frota</h2>
              <p><strong>Empresa:</strong> Caeli Transportes | <strong>CNPJ:</strong> 38.404.019/0001-76</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '12px' }}>
                <thead><tr style={{ backgroundColor: '#f8fafc' }}><th style={{ border: '1px solid #e2e8f0', padding: '8px' }}>Item</th><th style={{ border: '1px solid #e2e8f0', padding: '8px' }}>Status</th></tr></thead>
                <tbody>
                  {arquivos.map(a => (<tr key={a.id}><td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{a.nome_arquivo}</td><td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{a.status}</td></tr>))}
                </tbody>
              </table>
            </div>
            <button onClick={() => window.print()} style={{ width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>IMPRIMIR PDF</button>
          </div>
        </div>
      )}

      <style>{`
        @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; } }
      `}</style>
    </div>
  );
}
