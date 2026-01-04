import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(data || []);
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
    setMsg("Processando documentos da Cardoso & Rates...");

    for (const file of files) {
      try {
        const placa = extrairPlaca(file.name);
        const path = `v65/${Date.now()}_${file.name}`;
        
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

        // PAYLOAD AJUSTADO PARA SUA NOVA TABELA
        const payload = {
          empresa_cnpj: '38.404.019/0001-76',
          placa: placa,
          motorista: 'DOC_IMPORTADO',
          status_antt: 'ATIVO',
          // O sistema salva o link no campo motorista temporariamente se não houver coluna de link
          // Mas como você criou colunas de data, vamos focar nelas:
          validade_civ: file.name.includes("CIV") ? "2025-12-31" : null,
          validade_cipp: file.name.includes("CIPP") ? "2025-12-31" : null
        };

        const { error } = await supabase.from('frota_veiculos').insert([payload]);
        if (error) setMsg("Erro: " + error.message);
        else setMsg("Veículo " + placa + " adicionado com sucesso!");

      } catch (err) { setMsg("Falha: " + err.message); }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#0a0f1e', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ border: '2px solid #38bdf8', padding: '20px', borderRadius: '10px' }}>
        <h1 style={{ color: '#38bdf8' }}>MAXIMUS v65 - GESTÃO DE FROTA</h1>
        <p>CNPJ CLIENTE: 38.404.019/0001-76</p>
        <div style={{ color: '#fbbf24' }}>{msg}</div>
        <input type="file" multiple onChange={handleUpload} style={{ marginTop: '20px' }} />
      </div>

      <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1e293b' }}>
            <th style={{ padding: '10px' }}>PLACA</th>
            <th style={{ padding: '10px' }}>MOTORISTA</th>
            <th style={{ padding: '10px' }}>CIV</th>
            <th style={{ padding: '10px' }}>CIPP</th>
            <th style={{ padding: '10px' }}>ANTT</th>
          </tr>
        </thead>
        <tbody>
          {frota.map(v => (
            <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '10px' }}>{v.placa}</td>
              <td style={{ padding: '10px' }}>{v.motorista}</td>
              <td style={{ padding: '10px' }}>{v.validade_civ || '---'}</td>
              <td style={{ padding: '10px' }}>{v.validade_cipp || '---'}</td>
              <td style={{ padding: '10px', color: '#4ad395' }}>{v.status_antt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
