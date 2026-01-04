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
    const m = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : null;
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const placa = extrairPlaca(file.name);
      if (placa) {
        const path = `v38/${Date.now()}_${file.name}`;
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
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #38bdf8', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', margin: 0 }}>MAXIMUS v38.0</h1>
        <p style={{ color: '#38bdf8', fontWeight: 'bold' }}>SISTEMA ATUALIZADO E PRONTO</p>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
        <label style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? "SINCRONIZANDO..." : "1. CLIQUE AQUI PARA SUBIR PDFS"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
        <button onClick={() => carregarDados()} style={{ background: 'none', border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          ATUALIZAR TELA
        </button>
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px' }}>
        <h2>FROTA ATIVA ({frota.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px' }}>PLACA</th>
              <th style={{ padding: '10px' }}>CIV</th>
              <th style={{ padding: '10px' }}>CIPP</th>
              <th style={{ padding: '10px' }}>ARQUIVO</th>
            </tr>
          </thead>
          <tbody>
            {frota.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '20px' }}>{v.placa}</td>
                <td style={{ color: v.validade_civ === 'PENDENTE' ? '#f87171' : '#4ade80' }}>{v.validade_civ}</td>
                <td style={{ color: v.validade_cipp === 'PENDENTE' ? '#f87171' : '#4ade80' }}>{v.validade_cipp}</td>
                <td><a href={v.url_doc_referencia} target="_blank" style={{ color: '#38bdf8' }}>ABRIR</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
