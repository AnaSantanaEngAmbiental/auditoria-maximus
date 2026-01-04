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

  // FUNÇÃO DE DETECÇÃO MELHORADA (Lê qualquer formato)
  const extrairTudo = (nomeArquivo) => {
    const limpo = nomeArquivo.toUpperCase().replace(/\s/g, '');
    
    // Procura Padrão Mercosul ou Antigo em qualquer lugar do nome
    const regexPlaca = /([A-Z]{3}[0-9][A-Z0-9][0-9]{2})|([A-Z]{3}[0-9]{4})/;
    const encontrado = limpo.match(regexPlaca);
    
    return encontrado ? encontrado[0] : "PLACA-NAO-IDENTIFICADA";
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const placaDetectada = extrairTudo(file.name);
      
      // Upload aceitando qualquer tipo (MIME TYPE automático)
      const path = `v63/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

      const isCiv = file.name.toUpperCase().includes("CIV") || file.name.includes("31");
      const isCipp = file.name.toUpperCase().includes("CIPP") || file.name.includes("52");

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placaDetectada).maybeSingle();
      
      const payload = {
        placa: placaDetectada,
        motorista: "DOC_IMPORTADO",
        validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: urlData.publicUrl
      };

      if (ex && placaDetectada !== "PLACA-NAO-IDENTIFICADA") {
        await supabase.from('frota_veiculos').update(payload).eq('id', ex.id);
      } else {
        await supabase.from('frota_veiculos').insert([payload]);
      }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#0a0f1e', color: '#e2e8f0', minHeight: '100vh', padding: '30px', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', margin: 0 }}>MAXIMUS v63</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>SUPORTA: PDF, XLSX, DOCX, JPG, JSON</p>
        </div>
        <label style={{ backgroundColor: '#38bdf8', color: '#000', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? "PROCESSANDO ARQUIVOS..." : "SUBIR QUALQUER ARQUIVO"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </header>

      <div style={{ marginTop: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
              <th style={{ padding: '12px' }}>VEÍCULO (PLACA)</th>
              <th style={{ padding: '12px' }}>CIV</th>
              <th style={{ padding: '12px' }}>CIPP</th>
              <th style={{ padding: '12px' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {frota.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #1e293b', backgroundColor: v.placa === 'PLACA-NAO-IDENTIFICADA' ? '#2d1a1a' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{v.placa}</td>
                <td style={{ padding: '12px' }}>{v.validade_civ}</td>
                <td style={{ padding: '12px' }}>{v.validade_cipp}</td>
                <td style={{ padding: '12px' }}>
                  <a href={v.url_doc_referencia} target="_blank" style={{ color: '#38bdf8' }}>VER ARQUIVO</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
