import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Carrega os dados assim que abre o site
  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data, error } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      if (error) throw error;
      setFrota(data || []);
    } catch (e) { console.error(e); }
  }

  // Função para identificar a placa no nome do arquivo
  const extrairPlaca = (nome) => {
    const limpo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = limpo.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || limpo.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : "SEM_PLACA";
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setMsg("Processando " + files.length + " arquivos...");

    for (const file of files) {
      try {
        const placa = extrairPlaca(file.name);
        const nomeNoStorage = `v66/${Date.now()}_${file.name}`;
        
        // 1. Envia o arquivo para o Storage
        const { error: upError } = await supabase.storage.from('processos-ambientais').upload(nomeNoStorage, file);
        if (upError) throw upError;

        // 2. Pega o link público do arquivo
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(nomeNoStorage);

        // 3. Salva ou Atualiza na tabela (UPSERT)
        const payload = {
          empresa_cnpj: '38.404.019/0001-76', // CNPJ da Cardoso & Rates
          placa: placa,
          motorista: 'IMPORTADO_AUTO',
          status_antt: 'ATIVO',
          url_doc_referencia: urlData.publicUrl
        };

        const { error: dbError } = await supabase.from('frota_veiculos').upsert(payload, { onConflict: 'placa' });
        if (dbError) throw dbError;

        setMsg("Veículo " + placa + " processado com sucesso!");
      } catch (err) { 
        setMsg("Erro no arquivo " + file.name + ": " + err.message);
        console.error(err);
      }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', border: '1px solid #38bdf8', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>MAXIMUS v66 - AUDITORIA</h1>
        <p style={{ color: '#94a3b8', margin: '5px 0' }}>CLIENTE: CARDOSO & RATES | CNPJ: 38.404.019/0001-76</p>
        
        <div style={{ background: '#000', padding: '10px', borderRadius: '8px', color: '#fbbf24', marginTop: '15px', border: '1px solid #334155' }}>
          <strong>STATUS:</strong> {msg || "Aguardando novos arquivos para processar..."}
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <label style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
            {loading ? "CARREGANDO..." : "ESCOLHER ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {frota.map(v => (
          <div key={v.id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #38bdf8', transition: '0.3s' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', letterSpacing: '1px' }}>{v.placa}</h2>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '15px' }}>
              <p style={{ margin: '4px 0' }}><strong>ANTT:</strong> <span style={{color: '#4ade80'}}>{v.status_antt}</span></p>
              <p style={{ margin: '4px 0' }}><strong>CIV:</strong> {v.validade_civ || 'PENDENTE'}</p>
              <p style={{ margin: '4px 0' }}><strong>CIPP:</strong> {v.validade_cipp || 'PENDENTE'}</p>
            </div>
            {v.url_doc_referencia ? (
              <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#38bdf8', color: '#0f172a', padding: '10px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}>
                ABRIR DOCUMENTO
              </a>
            ) : (
              <span style={{ color: '#64748b', fontSize: '12px' }}>Sem documento anexo</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
