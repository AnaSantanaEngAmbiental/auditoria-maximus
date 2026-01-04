import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// CARIMBO DE CONTROLE - MUDOU PARA 60 PARA TESTE DE RESET
const VERSION = "v60.0 - RESET TOTAL";

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    carregar(); 
  }, []);

  async function carregar() {
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
        const path = `v60/${Date.now()}_${file.name}`;
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
    carregar();
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#1a202c', color: 'white', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>MAXIMUS {VERSION}</h1>
        <label style={{ backgroundColor: '#48bb78', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? "ENVIANDO..." : "SUBIR PDF"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Veículos na Frota ({frota.length})</h2>
        {frota.map(v => (
          <div key={v.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '5px solid #48bb78', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{v.placa}</span>
            <span>CIV: {v.validade_civ} | CIPP: {v.validade_cipp}</span>
            <a href={v.url_doc_referencia} target="_blank" style={{ color: '#3182ce' }}>Ver Documento</a>
          </div>
        ))}
      </div>
    </div>
  );
}
