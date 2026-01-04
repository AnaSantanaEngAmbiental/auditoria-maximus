import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(""); // BARRA DE MENSAGEM

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data, error } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      if (error) setMsg("Erro ao carregar banco: " + error.message);
      setFrota(data || []);
    } catch (e) { setMsg("Erro crítico: " + e.message); }
  }

  const extrairPlaca = (nome) => {
    const limpo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = limpo.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || limpo.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : "SEM_PLACA";
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setMsg("Iniciando processamento de " + files.length + " arquivos...");

    for (const file of files) {
      try {
        const placa = extrairPlaca(file.name);
        const path = `v64/${Date.now()}_${file.name}`;
        
        // Tenta o Upload
        const { error: upError } = await supabase.storage.from('processos-ambientais').upload(path, file);
        if (upError) { setMsg("Erro no Upload: " + upError.message); continue; }

        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

        // Tenta salvar no Banco
        const payload = {
          placa: placa,
          motorista: "AUDITORIA_V64",
          validade_civ: "PENDENTE",
          validade_cipp: "PENDENTE",
          url_doc_referencia: urlData.publicUrl
        };

        const { error: dbError } = await supabase.from('frota_veiculos').upsert(payload, { onConflict: 'placa' });
        if (dbError) setMsg("Erro no Banco: " + dbError.message);
        else setMsg("Sucesso! Veículo " + placa + " atualizado.");

      } catch (err) { setMsg("Falha geral: " + err.message); }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ border: '1px solid #0f0', padding: '15px', marginBottom: '20px' }}>
        <h2>MAXIMUS SYSTEM v64</h2>
        <div style={{ color: 'yellow', fontWeight: 'bold' }}>LOG: {msg || "Aguardando ação..."}</div>
      </div>

      <input type="file" multiple onChange={handleUpload} style={{ marginBottom: '20px', color: '#0f0' }} />
      {loading && <p>CONECTANDO AO SATÉLITE...</p>}

      <table style={{ width: '100%', border: '1px solid #0f0' }}>
        <thead>
          <tr>
            <th>PLACA</th>
            <th>DOCS</th>
            <th>LINK</th>
          </tr>
        </thead>
        <tbody>
          {frota.map(v => (
            <tr key={v.id}>
              <td>{v.placa}</td>
              <td>CIV: {v.validade_civ}</td>
              <td><a href={v.url_doc_referencia} target="_blank" style={{color: '#fff'}}>[ABRIR]</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
