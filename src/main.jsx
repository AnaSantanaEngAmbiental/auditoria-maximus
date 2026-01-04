import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const VERSAO = "MAXIMUS v40.0 - FORCE UPDATE";
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    const carregar = async () => {
      const { data } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(data || []);
    };
    carregar();
  }, []);

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const n = file.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const m = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
      const placa = m ? m[0] : null;

      if (placa) {
        const path = `v40/${Date.now()}_${file.name}`;
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
    window.location.reload();
  }

  return (
    <div style={{ backgroundColor: '#4c1d95', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '4px solid #a78bfa', paddingBottom: '10px' }}>{VERSAO}</h1>
      <div style={{ margin: '20px 0' }}>
        <label style={{ backgroundColor: '#a78bfa', color: '#fff', padding: '20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}>
          {loading ? "SUBINDO..." : "CLIQUE PARA TESTAR UPLOAD v40"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
        <h2>FROTA ({frota.length})</h2>
        {frota.map(v => (
          <div key={v.id} style={{ borderBottom: '1px solid #6d28d9', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{v.placa}</strong></span>
            <span>CIV: {v.validade_civ} | CIPP: {v.validade_cipp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
