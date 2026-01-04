import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Eye, ShieldCheck, RefreshCw, Search
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV28() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(veiculos || []);
  }

  const superScanner = (nomeArquivo) => {
    // 1. Limpeza radical: remove extensões e símbolos
    const nomeLimpo = nomeArquivo.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // 2. Busca qualquer sequência de 7 caracteres (Padrão de Placa Brasil)
    // Isso pega ABC1234, ABC1A23, e variações
    const regexPlaca = /[A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}[0-9]{4}/;
    const match = nomeLimpo.match(regexPlaca);
    const placaAchada = match ? match[0] : null;

    // 3. Identifica tipo de documento
    const isCiv = nomeLimpo.includes("CIV") || nomeLimpo.includes("CRLV") || nomeLimpo.includes("31");
    const isCipp = nomeLimpo.includes("CIPP") || nomeLimpo.includes("CTPP") || nomeLimpo.includes("52");

    return { placa: placaAchada, isCiv, isCipp, lido: nomeLimpo };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    let logs = [];

    for (const file of files) {
      const info = superScanner(file.name);
      
      if (!info.placa) {
        logs.push(`❌ FALHA: Não achei placa em "${file.name}" (Lido: ${info.lido})`);
        continue;
      }

      // Upload Storage
      const path = `v28/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: urlRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      // Salva Registro do Arquivo
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: urlRes.publicUrl,
        placa_relacionada: info.placa
      }]);

      // Upsert na Frota (Unificação)
      const { data: existe } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      
      const payload = {
        placa: info.placa,
        motorista: "CAMINHÃO AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (existe?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (existe?.validade_cipp || "PENDENTE"),
        url_doc_referencia: urlRes.publicUrl
      };

      if (existe) {
        await supabase.from('frota_veiculos').update(payload).eq('id', existe.id);
      } else {
        await supabase.from('frota_veiculos').insert([payload]);
      }
      logs.push(`✅ SUCESSO: Placa ${info.placa} extraída de "${file.name}"`);
    }

    setDebugLog(logs);
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if(!confirm("Apagar tudo?")) return;
    setLoading(true);
    await supabase.from('frota_veiculos').delete().neq('placa', '0');
    await carregarDados();
    setLoading(false);
    setDebugLog(["BANCO RESETADO"]);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ background: '#1a202c', color: 'white', padding: '25px', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="#48bb78" /> MAXIMUS v28
          </h1>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>Scanner de Placas Mercosul e Antigas</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={resetTotal} style={{ background: '#f56565', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>RESETAR</button>
          
          <label style={{ background: '#4c51bf', color: 'white', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            {loading ? "PROCESSANDO..." : "CARREGAR ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </div>

      {/* PAINEL DE DEBUG (IMPORTANTE) */}
      {debugLog.length > 0 && (
        <div style={{ background: '#2d3748', color: '#a0aec0', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', fontFamily: 'monospace' }}>
          <strong>LOG DE CAPTURA:</strong>
          {debugLog.map((log, i) => <div key={i} style={{ marginTop: '5px', color: log.includes('✅') ? '#68d391' : '#fc8181' }}>{log}</div>)}
        </div>
      )}

      {/* NAVEGAÇÃO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAbaAtiva('frota')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'frota' ? '#4c51bf' : 'white', color: abaAtiva === 'frota' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer' }}>🚚 FROTA AUDITADA ({frota.length})</button>
        <button onClick={() => setAbaAtiva('docs')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'docs' ? '#4c51bf' : 'white', color: abaAtiva === 'docs' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer' }}>📂 ARQUIVOS BRUTOS ({arquivos.length})</button>
      </div>

      {/* TABELA / RESULTADO */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {abaAtiva === 'frota' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #edf2f7', color: '#718096', fontSize: '14px' }}>
                <th style={{ padding: '15px' }}>PLACA IDENTIFICADA</th>
                <th style={{ padding: '15px' }}>DOC. CIV</th>
                <th style={{ padding: '15px' }}>DOC. CIPP</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {frota.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: '#2d3748' }}>{v.placa}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ background: v.validade_civ === 'PENDENTE' ? '#fff5f5' : '#f0fff4', color: v.validade_civ === 'PENDENTE' ? '#c53030' : '#2f855a', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>{v.validade_civ}</span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ background: v.validade_cipp === 'PENDENTE' ? '#fff5f5' : '#f0fff4', color: v.validade_cipp === 'PENDENTE' ? '#c53030' : '#2f855a', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>{v.validade_cipp}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4c51bf' }}><Eye size={24} /></a>
                  </td>
                </tr>
              ))}
              {frota.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: '#a0aec0' }}>Aguardando upload de arquivos com placas no nome...</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {arquivos.map(a => (
              <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                <FileText size={30} color="#4c51bf" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                <div style={{ fontSize: '10px', color: '#48bb78', marginTop: '10px', fontWeight: 'bold' }}>Placa Detectada: {a.placa_relacionada}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
