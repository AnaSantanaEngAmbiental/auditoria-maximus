import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão com o Banco
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(data || []);
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const n = file.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const m = n.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
      const placa = m ? m[0] : null;

      if (placa) {
        const path = `v62/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        const isCiv = file.name.toUpperCase().includes("CIV") || file.name.includes("31");
        const isCipp = file.name.toUpperCase().includes("CIPP") || file.name.includes("52");

        const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        const payload = {
          placa, motorista: "AUDITADO",
          validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
          url_doc_referencia: urlData.publicUrl
        };

        if (ex) { await supabase.from('frota_veiculos').update(payload).eq('id', ex.id); }
        else { await supabase.from('frota_veiculos').insert([payload]); }
      }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #334155', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#38bdf8' }}>MAXIMUS v62 - AUDITORIA</h1>
        <label style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? "PROCESSANDO..." : "CARREGAR PDFS"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </header>

      <div style={{ display: 'grid', gap: '15px' }}>
        {frota.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Nenhum veículo carregado no sistema.</p>
        ) : (
          frota.map(v => (
            <div key={v.id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{v.placa}</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                <span style={{ color: v.validade_civ === 'PENDENTE' ? '#f87171' : '#4ad395' }}>CIV: {v.validade_civ}</span>
                <span style={{ color: v.validade_cipp === 'PENDENTE' ? '#f87171' : '#4ad395' }}>CIPP: {v.validade_cipp}</span>
              </div>
              <a href={v.url_doc_referencia} target="_blank" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>ABRIR DOC</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
