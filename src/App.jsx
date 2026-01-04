import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// CARIMBO DE CONTROLE - MUDE ESTE NÚMERO PARA SABER SE SALVOU
const BUILD_VERSION = "51.0.4-MASTER"; 

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
        const path = `v51/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        const isCiv = file.name.toUpperCase().includes("CIV") || file.name.includes("31");
        const isCipp = file.name.toUpperCase().includes("CIPP") || file.name.includes("52");

        const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        
        const payload = {
          placa,
          motorista: "AUDITADO",
          validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
          url_doc_referencia: urlData.publicUrl
        };

        if (ex) { await supabase.from('frota_veiculos').update(payload).eq('id', ex.id); }
        else { await supabase.from('frota_veiculos').insert([payload]); }
      }
    }
    setLoading(false);
    window.location.reload(); 
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '30px', fontFamily: 'monospace' }}>
      
      {/* BARRA DE VERSÃO - O QUE VOCÊ PRECISAVA */}
      <div style={{ border: '2px solid #0f0', padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>MAXIMUS v51</h1>
          <span style={{ backgroundColor: '#0f0', color: '#000', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold' }}>
            ENGINE BUILD: {BUILD_VERSION}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>BANCO: ONLINE</p>
            <p style={{ margin: 0, fontSize: '12px' }}>FROTA: {frota.length} VEÍCULOS</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ border: '2px solid #0f0', padding: '15px 30px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-block' }}>
          {loading ? ">>> SINCRONIZANDO <<<" : "[ SUBIR NOVOS PDFS ]"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>

      <div style={{ border: '1px solid #333' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#111' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #0f0' }}>PLACA</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #0f0' }}>CIV</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #0f0' }}>CIPP</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #0f0' }}>LINK</th>
            </tr>
          </thead>
          <tbody>
            {frota.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '12px', fontSize: '18px' }}>{v.placa}</td>
                <td style={{ padding: '12px', color: v.validade_civ === 'PENDENTE' ? 'red' : '#0f0' }}>{v.validade_civ}</td>
                <td style={{ padding: '12px', color: v.validade_cipp === 'PENDENTE' ? 'red' : '#0f0' }}>{v.validade_cipp}</td>
                <td style={{ padding: '12px' }}>
                  <a href={v.url_doc_referencia} target="_blank" style={{ color: '#0f0' }}>[VER]</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
