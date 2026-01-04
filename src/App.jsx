import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// VERSÃO PARA FORÇAR O VERCEL
const VERSAO_LABEL = "MAXIMUS v36.0 - TUDO OK";

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV36() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: f } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    const { data: a } = await supabase.from('arquivos_processo').select('*').order('created_at', { descending: true });
    setFrota(f || []);
    setArquivos(a || []);
  }

  const extrairPlaca = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : null;
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const placa = extrairPlaca(file.name);
      if (placa) {
        const path = `v36/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        const isCiv = file.name.toUpperCase().includes("CIV");
        const isCipp = file.name.toUpperCase().includes("CIPP");

        const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        const dados = {
          placa,
          motorista: "AUDITORIA",
          validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
          url_doc_referencia: url.publicUrl
        };

        if (ex) { await supabase.from('frota_veiculos').update(dados).eq('id', ex.id); }
        else { await supabase.from('frota_veiculos').insert([dados]); }
        
        await supabase.from('arquivos_processo').insert([{ 
            nome_arquivo: file.name, url_publica: url.publicUrl, placa_relacionada: placa 
        }]);
      }
    }
    await carregarDados();
    setLoading(false);
  }

  async function resetar() {
    if(!confirm("Apagar tudo?")) return;
    setLoading(true);
    await supabase.from('frota_veiculos').delete().neq('id', 0);
    await carregarDados();
    setLoading(false);
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* CABEÇALHO */}
      <div style={{ backgroundColor: '#1a365d', color: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>{VERSAO_LABEL}</h1>
        <p>Sistema de Auditoria de Frota</p>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <label style={{ backgroundColor: '#48bb78', color: 'white', padding: '15px 25px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? "PROCESSANDO..." : "CARREGAR ARQUIVOS (PDF)"}
                <input type="file" multiple onChange={handleUpload} hidden />
            </label>
            <button onClick={resetar} style={{ backgroundColor: '#f56565', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                RESETAR BANCO
            </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* TABELA */}
        <div style={{ flex: 2, backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
          <h2>🚚 Frota Identificada ({frota.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>PLACA</th>
                <th style={{ padding: '10px' }}>CIV</th>
                <th style={{ padding: '10px' }}>CIPP</th>
                <th style={{ padding: '10px' }}>DOC</th>
              </tr>
            </thead>
            <tbody>
              {frota.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '18px' }}>{v.placa}</td>
                  <td style={{ color: v.validade_civ === 'PENDENTE' ? 'red' : 'green' }}>{v.validade_civ}</td>
                  <td style={{ color: v.validade_cipp === 'PENDENTE' ? 'red' : 'green' }}>{v.validade_cipp}</td>
                  <td><a href={v.url_doc_referencia} target="_blank">VER</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOGS */}
        <div style={{ flex: 1, backgroundColor: '#edf2f7', padding: '20px', borderRadius: '10px' }}>
          <h2>📂 Arquivos ({arquivos.length})</h2>
          {arquivos.map(a => (
            <div key={a.id} style={{ fontSize: '11px', borderBottom: '1px solid #cbd5e0', padding: '5px 0' }}>
              {a.nome_arquivo} <br/>
              <strong>Placa: {a.placa_relacionada}</strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
