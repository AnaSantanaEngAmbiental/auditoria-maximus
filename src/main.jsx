import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// VERSÃO 50 - SE VOCÊ NÃO VER ESTE TÍTULO, LIMPE O CACHE DO NAVEGADOR
const VERSAO_LABEL = "MAXIMUS v50.0 - BLACK DIAMOND";

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

  const extrairPlaca = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = n.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : null;
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      const placa = extrairPlaca(file.name);
      if (placa) {
        const path = `v50/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        const isCiv = file.name.toUpperCase().includes("CIV") || file.name.includes("31");
        const isCipp = file.name.toUpperCase().includes("CIPP") || file.name.includes("52");

        const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        
        const payload = {
          placa,
          motorista: "AUDITADO",
          validade_civ: isCiv ? "31/12/2026" : (existente?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (existente?.validade_cipp || "PENDENTE"),
          url_doc_referencia: urlData.publicUrl
        };

        if (existente) {
          await supabase.from('frota_veiculos').update(payload).eq('id', existente.id);
        } else {
          await supabase.from('frota_veiculos').insert([payload]);
        }
      }
    }
    
    setLoading(false);
    window.location.reload(); // Força a atualização da tela
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'monospace' }}>
      
      <div style={{ border: '4px solid #00ff00', padding: '20px', marginBottom: '30px' }}>
        <h1 style={{ color: '#00ff00', margin: 0, fontSize: '32px' }}>{VERSAO_LABEL}</h1>
        <p style={{ color: '#888' }}>CONTROLE DE FROTA AMBIENTAL - SUPABASE MASTER</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ backgroundColor: '#00ff00', color: '#000', padding: '20px 40px', borderRadius: '5px', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', display: 'inline-block' }}>
          {loading ? ">>> PROCESSANDO <<<" : "SUBIR ARQUIVOS (PDF)"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>

      <div style={{ border: '1px solid #333', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111' }}>
          <thead>
            <tr style={{ backgroundColor: '#222', color: '#00ff00', textAlign: 'left' }}>
              <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>PLACA</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>CIV (3.1)</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>CIPP (5.2)</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>LINK</th>
            </tr>
          </thead>
          <tbody>
            {frota.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px' }}>{v.placa}</td>
                <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? 'red' : '#00ff00' }}>{v.validade_civ}</td>
                <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? 'red' : '#00ff00' }}>{v.validade_cipp}</td>
                <td style={{ padding: '15px' }}>
                  <a href={v.url_doc_referencia} target="_blank" style={{ color: '#00ff00', textDecoration: 'none' }}>[ VER PDF ]</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {frota.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>
            NENHUM VEÍCULO DETECTADO. FAÇA O UPLOAD DE ARQUIVOS COM A PLACA NO NOME.
          </div>
        )}
      </div>

    </div>
  );
}
