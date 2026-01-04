import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(data || []);
  }

  const extrairPlaca = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = n.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : null;
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    for (const file of files) {
      const placa = extrairPlaca(file.name);
      if (placa) {
        const path = `v39/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        const isCiv = file.name.toUpperCase().includes("CIV");
        const isCipp = file.name.toUpperCase().includes("CIPP");

        const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        const dados = {
          placa, motorista: "AUDITADO",
          validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
          url_doc_referencia: url.publicUrl
        };

        if (ex) { await supabase.from('frota_veiculos').update(dados).eq('id', ex.id); }
        else { await supabase.from('frota_veiculos').insert([dados]); }
      }
    }
    await carregarDados();
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '30px', fontFamily: 'monospace' }}>
      <div style={{ border: '2px solid #0f0', padding: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>MAXIMUS SYSTEM v39.0</h1>
        <p>STATUS: SISTEMA OPERACIONAL | BANCO: CONECTADO</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ backgroundColor: '#0f0', color: '#000', padding: '15px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
          {loading ? ">>> PROCESSANDO <<<" : "[ CARREGAR DOCUMENTOS ]"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
        <button onClick={() => carregarDados()} style={{ marginLeft: '10px', background: 'none', border: '1px solid #0f0', color: '#0f0', padding: '15px', cursor: 'pointer' }}>RECARREGAR</button>
      </div>

      <div style={{ border: '1px solid #0f0', padding: '15px' }}>
        <h2 style={{ borderBottom: '1px solid #0f0' }}>LISTA DE FROTA ({frota.length})</h2>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px' }}>PLACA</th>
              <th style={{ padding: '10px' }}>CIV</th>
              <th style={{ padding: '10px' }}>CIPP</th>
              <th style={{ padding: '10px' }}>URL</th>
            </tr>
          </thead>
          <tbody>
            {frota.map(v => (
              <tr key={v.id} style={{ borderTop: '1px solid #040' }}>
                <td style={{ padding: '10px', fontSize: '18px' }}>{v.placa}</td>
                <td style={{ color: v.validade_civ === 'PENDENTE' ? 'red' : '#0f0' }}>{v.validade_civ}</td>
                <td style={{ color: v.validade_cipp === 'PENDENTE' ? 'red' : '#0f0' }}>{v.validade_cipp}</td>
                <td><a href={v.url_doc_referencia} target="_blank" style={{ color: '#0f0' }}>[VER]</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
