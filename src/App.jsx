import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão direta com o Supabase
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Carregar dados ao iniciar
  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data, error } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    if (!error) setFrota(data || []);
  }

  // Função para Identificar Placa no nome do arquivo
  const extrairPlaca = (nome) => {
    const limpo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = limpo.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/) || limpo.match(/[A-Z]{3}[0-9]{4}/);
    return m ? m[0] : "SEM_PLACA";
  };

  // Função para Apagar Veículo
  async function eliminarVeiculo(id, placa) {
    if (!window.confirm(`Deseja realmente remover o veículo ${placa}?`)) return;
    
    setMsg(`Removendo ${placa}...`);
    const { error } = await supabase.from('frota_veiculos').delete().eq('id', id);
    
    if (error) {
      setMsg("Erro ao remover: " + error.message);
    } else {
      setMsg("Veículo removido com sucesso!");
      carregarDados();
    }
  }

  // Função de Upload de Arquivos
  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setMsg(`Processando ${files.length} arquivos...`);

    for (const file of files) {
      try {
        const placa = extrairPlaca(file.name);
        const path = `v67/${Date.now()}_${file.name}`;
        
        // Upload para o Storage
        const { error: upError } = await supabase.storage.from('processos-ambientais').upload(path, file);
        if (upError) throw upError;

        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

        // Salva na Tabela (Upsert evita duplicados)
        const { error: dbError } = await supabase.from('frota_veiculos').upsert({
          placa: placa,
          empresa_cnpj: '38.404.019/0001-76',
          motorista: 'IMPORTADO_AUTO',
          status_antt: 'ATIVO',
          url_doc_referencia: urlData.publicUrl
        }, { onConflict: 'placa' });

        if (dbError) throw dbError;
        setMsg(`Sucesso: ${placa} sincronizado.`);
      } catch (err) {
        setMsg("Falha no arquivo " + file.name);
      }
    }
    setLoading(false);
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#020617', color: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO */}
      <header style={{ 
        background: '#0f172a', 
        padding: '25px', 
        borderRadius: '16px', 
        border: '1px solid #1e293b', 
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '26px' }}>MAXIMUS v67</h1>
          <p style={{ margin: '5px 0', color: '#94a3b8' }}>Frota Ativa: <strong>{frota.length} veículos</strong></p>
          <div style={{ color: '#fbbf24', fontSize: '13px', marginTop: '10px' }}>LOG: {msg || "Sistema Pronto"}</div>
        </div>

        <label style={{ 
          backgroundColor: '#38bdf8', 
          color: '#020617', 
          padding: '12px 24px', 
          borderRadius: '10px', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          boxShadow: '0 4px 14px 0 rgba(56, 189, 248, 0.39)'
        }}>
          {loading ? "PROCESSANDO..." : "+ SUBIR DOCUMENTOS"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </header>

      {/* GRID DE VEÍCULOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {frota.map(v => (
          <div key={v.id} style={{ 
            background: '#0f172a', 
            padding: '20px', 
            borderRadius: '16px', 
            border: '1px solid #1e293b', 
            position: 'relative',
            transition: 'transform 0.2s'
          }}>
            {/* BOTÃO EXCLUIR */}
            <button 
              onClick={() => eliminarVeiculo(v.id, v.placa)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: '#1e293b', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 'bold' }}
            >
              ✕
            </button>

            <h2 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '22px' }}>{v.placa}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                <span style={{color: '#94a3b8'}}>CIV:</span><br/>
                <strong>{v.validade_civ || 'PENDENTE'}</strong>
              </div>
              <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                <span style={{color: '#94a3b8'}}>CIPP:</span><br/>
                <strong>{v.validade_cipp || 'PENDENTE'}</strong>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 15px 0' }}>
              STATUS ANTT: <span style={{color: '#4ade80', fontWeight: 'bold'}}>{v.status_antt || 'ATIVO'}</span>
            </p>

            {v.url_doc_referencia ? (
              <a 
                href={v.url_doc_referencia} 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  background: '#38bdf8', 
                  color: '#020617', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontWeight: 'bold', 
                  textDecoration: 'none' 
                }}
              >
                ABRIR PROCESSO PDF
              </a>
            ) : (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '12px', padding: '12px', border: '1px dashed #334155', borderRadius: '10px' }}>
                Sem arquivo anexado
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
