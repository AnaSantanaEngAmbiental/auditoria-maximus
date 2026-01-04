import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, Trash2, Download, Eye, ShieldCheck, RefreshCw 
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV29() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(veiculos || []);
  }

  const extrairDados = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return {
      placa: match ? match[0] : null,
      isCiv: n.includes("CIV") || n.includes("CRLV") || n.includes("31"),
      isCipp: n.includes("CIPP") || n.includes("CTPP") || n.includes("52")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairDados(file.name);
      if (!info.placa) continue;

      const path = `v29/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: urlRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, url_publica: urlRes.publicUrl, placa_relacionada: info.placa 
      }]);

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      const payload = {
        placa: info.placa,
        motorista: "AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: urlRes.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(payload).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([payload]); }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if(!confirm("Deseja apagar tudo mesmo?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if(f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      
      {/* BARRA SUPERIOR FIXA - AGORA ELA NÃO SOME */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck color="#10b981" size={28} />
          <h1 style={{ fontSize: '20px', margin: 0 }}>MAXIMUS v29</h1>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={resetTotal} style={{ background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Trash2 size={16} /> RESETAR BANCO
          </button>
          
          <label style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
            {loading ? "PROCESSANDO..." : "SUBIR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </div>

      <div style={{ padding: '30px' }}>
        {/* DASHBOARD RÁPIDO */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ flex: 1, padding: '20px', borderRadius: '15px', border: 'none', background: abaAtiva === 'frota' ? '#4f46e5' : 'white', color: abaAtiva === 'frota' ? 'white' : '#1e293b', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            🚚 FROTA ATIVA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ flex: 1, padding: '20px', borderRadius: '15px', border: 'none', background: abaAtiva === 'docs' ? '#4f46e5' : 'white', color: abaAtiva === 'docs' ? 'white' : '#1e293b', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            📂 REPOSITÓRIO ({arquivos.length})
          </button>
        </div>

        {/* TABELA PRINCIPAL */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>DOC. CIV</th>
                  <th style={{ padding: '15px' }}>DOC. CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {frota.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Nenhum veículo identificado. Renomeie o arquivo com a placa e suba novamente.</td></tr>
                ) : (
                  frota.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>{v.placa}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_civ}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_cipp}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={22} /></a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{a.nome_arquivo}</div>
                  <div style={{ fontSize: '10px', color: '#10b981', marginTop: '5px' }}>ID: {a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`.spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
