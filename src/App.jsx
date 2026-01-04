import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// IDENTIFICADOR VISUAL PARA CONFIRMAÇÃO
const VERSION = "v60.0 - RESET TOTAL";

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
    const { data } = await supabase
      .from('frota_veiculos')
      .select('*')
      .order('placa', { ascending: true });
    setFrota(data || []);
  }

  const extrairPlaca = (nome) => {
    // Remove caracteres especiais e espaços
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Tenta padrão Mercosul (ABC1D23) ou Antigo (ABC1234)
    const m = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : null;
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const placa = extrairPlaca(file.name);

      if (placa) {
        // 1. Upload para o Storage
        const path = `v60/${Date.now()}_${file.name}`;
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // 2. Identifica o tipo de documento pelo nome
        const isCiv = file.name.toUpperCase().includes("CIV") || file.name.includes("31");
        const isCipp = file.name.toUpperCase().includes("CIPP") || file.name.includes("52");

        // 3. Verifica se o veículo já existe na frota
        const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).maybeSingle();
        
        const payload = {
          placa,
          motorista: "AUDITADO",
          validade_civ: isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
          validade_cipp: isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
          url_doc_referencia: urlData.publicUrl
        };

        if (ex) {
          await supabase.from('frota_veiculos').update(payload).eq('id', ex.id);
        } else {
          await supabase.from('frota_veiculos').insert([payload]);
        }
      }
    }
    
    setLoading(false);
    carregarDados(); // Atualiza a lista na tela
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ 
        backgroundColor: '#1a202c', 
        color: 'white', 
        padding: '25px', 
        borderRadius: '12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>MAXIMUS {VERSION}</h1>
          <p style={{ margin: 0, color: '#48bb78', fontSize: '12px' }}>STATUS: AGUARDANDO COMANDO</p>
        </div>
        
        <label style={{ 
          backgroundColor: '#48bb78', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          fontWeight: 'bold',
          transition: '0.3s'
        }}>
          {loading ? "ENVIANDO..." : "CARREGAR DOCUMENTOS PDF"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>

      {/* TABELA DE RESULTADOS */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ color: '#2d3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          Veículos Identificados ({frota.length})
        </h2>
        
        {frota.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
            Nenhum dado encontrado. Use o botão acima para subir arquivos com placas no nome.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {frota.map(v => (
              <div key={v.id} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '10px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderLeft: '6px solid #48bb78'
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c' }}>{v.placa}</div>
                  <div style={{ fontSize: '14px', color: '#718096' }}>Status: Auditado</div>
                </div>

                <div style={{ display: 'flex', gap: '30px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>CIV</div>
                    <div style={{ fontWeight: 'bold', color: v.validade_civ === 'PENDENTE' ? '#e53e3e' : '#38a169' }}>
                      {v.validade_civ}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>CIPP</div>
                    <div style={{ fontWeight: 'bold', color: v.validade_cipp === 'PENDENTE' ? '#e53e3e' : '#38a169' }}>
                      {v.validade_cipp}
                    </div>
                  </div>
                </div>

                <a 
                  href={v.url_doc_referencia} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    color: '#3182ce', 
                    textDecoration: 'none', 
                    fontWeight: 'bold',
                    border: '1px solid #3182ce',
                    padding: '8px 16px',
                    borderRadius: '6px'
                  }}
                >
                  ABRIR PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
