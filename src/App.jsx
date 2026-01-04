import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV27() {
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

  const extrairPlacaUniversal = (nome) => {
    // Limpa o nome: remove espaços, hífens, pontos e vira tudo maiúsculo
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Procura Mercosul (ABC1D23) ou Antiga (ABC1234)
    const match = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    const placa = match ? match[0] : null;

    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("31");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("52");
    
    return { placa, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairPlacaUniversal(file.name);
      if (!info.placa) continue;

      const path = `v27/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: url.publicUrl,
        placa_relacionada: info.placa
      }]);

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      const dados = {
        placa: info.placa,
        motorista: "AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(dados).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([dados]); }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarSistema = async () => {
    if (!confirm("Isso apagará todos os dados da tela. Confirmar?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
    alert("Sistema Resetado!");
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO COM BOTÕES EXPOSTOS */}
      <div style={{ background: '#0f172a', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck color="#10b981"/> MAXIMUS v27</h2>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Auditoria de Placas Mercosul e Antigas</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetarSistema} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Trash2 size={16}/> RESETAR
            </button>
            
            <label style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {loading ? <RefreshCw className="spin" size={16}/> : <Download size={16}/>}
                {loading ? "CARREGANDO..." : "CARREGAR DOCUMENTOS"}
                <input type="file" multiple onChange={handleUpload} hidden />
            </label>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAbaAtiva('frota')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: abaAtiva === 'frota' ? '#4f46e5' : 'white', color: abaAtiva === 'frota' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>🚚 FROTA ({frota.length})</button>
        <button onClick={() => setAbaAtiva('docs')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: abaAtiva === 'docs' ? '#4f46e5' : 'white', color: abaAtiva === 'docs' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>📂 ARQUIVOS ({arquivos.length})</button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {abaAtiva === 'frota' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                <th style={{ padding: '15px' }}>PLACA</th>
                <th style={{ padding: '15px' }}>CIV</th>
                <th style={{ padding: '15px' }}>CIPP</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>DOC</th>
              </tr>
            </thead>
            <tbody>
              {frota.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum veículo identificado. Verifique se o nome do arquivo contém a placa.</td></tr>
              ) : (
                  frota.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px' }}>{v.placa}</td>
                      <td style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                      <td style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                      <td style={{ textAlign: 'center' }}><a href={v.url_doc_referencia} target="_blank" rel="noreferrer"><Eye size={22} color="#4f46e5"/></a></td>
                  </tr>
                  ))
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {arquivos.map(a => (
              <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <FileText size={24} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '5px' }}>Placa: {a.placa_relacionada}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
