import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RefreshCw, Eye, FileText, AlertTriangle, ShieldAlert } from 'lucide-react';

const VERSAO = "v34.0 - EMERGENCY FORCE";
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV34() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Aguardando ação...");

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: f } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    const { data: a } = await supabase.from('arquivos_processo').select('*');
    setFrota(f || []);
    setArquivos(a || []);
  }

  const detectarPlaca = (nome) => {
    const limpo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Regex ultra sensível
    const match = limpo.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || limpo.match(/[A-Z]{3}[0-9]{4}/);
    return match ? match[0] : null;
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setStatusMsg(`Processando ${files.length} arquivos...`);

    for (const file of files) {
      const placa = detectarPlaca(file.name);
      
      if (!placa) {
        setStatusMsg(`ERRO: Placa não detectada em "${file.name}"`);
        continue;
      }

      const path = `v34/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

      const isCiv = file.name.toUpperCase().includes("CIV");
      const isCipp = file.name.toUpperCase().includes("CIPP");

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
      const payload = {
        placa,
        motorista: "AUDITADO",
        validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(payload).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([payload]); }
      
      await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl, placa_relacionada: placa }]);
    }
    
    setStatusMsg("Upload concluído com sucesso!");
    await carregarDados();
    setLoading(false);
  };

  const resetarTudo = async () => {
    if(!confirm("CUIDADO: Isso apagará tudo!")) return;
    setLoading(true);
    await supabase.from('frota_veiculos').delete().neq('id', 0);
    await supabase.from('arquivos_processo').delete().neq('id', 0);
    await carregarDados();
    setLoading(false);
    setStatusMsg("Sistema resetado e limpo.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a202c', color: '#e2e8f0', fontFamily: 'monospace', padding: '20px' }}>
      
      {/* HEADER DE ALTA VISIBILIDADE */}
      <div style={{ border: '2px solid #ecc94b', padding: '20px', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#2d3748' }}>
        <h1 style={{ color: '#ecc94b', margin: 0, fontSize: '32px' }}>MAXIMUS {VERSAO}</h1>
        <p style={{ color: '#68d391', fontWeight: 'bold' }}>ESTADO DO SISTEMA: {statusMsg}</p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <label style={{ backgroundColor: '#ecc94b', color: '#000', padding: '15px 30px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
            {loading ? "CARREGANDO..." : "1. SELECIONAR ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
          <button onClick={resetarTudo} style={{ backgroundColor: '#f56565', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
            RESETAR BANCO
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* COLUNA DA FROTA */}
        <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#ecc94b', borderBottom: '1px solid #ecc94b' }}>🚚 FROTA ATUAL ({frota.length})</h2>
          <table style={{ width: '100%', marginTop: '10px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#a0aec0' }}>
                <th>PLACA</th>
                <th>CIV</th>
                <th>CIPP</th>
                <th>DOC</th>
              </tr>
            </thead>
            <tbody>
              {frota.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #4a5568' }}>
                  <td style={{ fontSize: '20px', padding: '10px', color: 'white' }}>{v.placa}</td>
                  <td style={{ color: v.validade_civ === 'PENDENTE' ? '#fc8181' : '#68d391' }}>{v.validade_civ}</td>
                  <td style={{ color: v.validade_cipp === 'PENDENTE' ? '#fc8181' : '#68d391' }}>{v.validade_cipp}</td>
                  <td><a href={v.url_doc_referencia} target="_blank" rel="noreferrer"><Eye color="#ecc94b"/></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* COLUNA DE LOGS */}
        <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#ecc94b', borderBottom: '1px solid #ecc94b' }}>📂 ARQUIVOS ({arquivos.length})</h2>
          {arquivos.map(a => (
            <div key={a.id} style={{ fontSize: '12px', marginBottom: '5px', borderBottom: '1px solid #4a5568', padding: '5px' }}>
              {a.nome_arquivo} <br/>
              <span style={{ color: '#68d391' }}>Placa: {a.placa_relacionada}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
