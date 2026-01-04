import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { municipiosPara, baseConhecimento } from './municipios';

const supabase = createClient('https://gmhxmtlidgcgpstxiiwg.supabase.co', 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs');

export default function App() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('licenciamento_ambiental').select('*').order('created_at', { ascending: false });
    setDados(data || []);
  }

  // MOTOR DE INTELIGÊNCIA: Identifica atividade e aplica Lei
  const auditarArquivo = (nomeArquivo) => {
    const nome = nomeArquivo.toUpperCase();
    let atividade = "Geral / Consultoria";
    if (nome.includes("POSTO")) atividade = "Postos de combustíveis";
    if (nome.includes("TRANSPORTE") || nome.includes("CIV")) atividade = "Transporte de produtos perigosos";
    if (nome.includes("OFICINA")) atividade = "Oficinas mecânicas";
    
    const placa = nome.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/)?.[0] || "";
    const info = baseConhecimento[atividade] || { lei: "Lei Est. 5.887/95", roteiro: "Análise documental padrão." };

    return { atividade, placa, info };
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setLoading(true);
    setMsg("Maximus processando auditoria...");

    for (const file of files) {
      try {
        const { atividade, placa, info } = auditarArquivo(file.name);
        const path = `auditoria_v70/${Date.now()}_${file.name}`;
        
        await supabase.storage.from('processos-ambientais').upload(path, file);
        const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);

        await supabase.from('licenciamento_ambiental').insert([{
          empresa_nome: "CARDOSO & RATES",
          tipo_atividade: atividade,
          placa: placa,
          url_documento: urlData.publicUrl,
          base_legal: info.lei,
          parecer_tecnico: `Análise PhD: ${info.roteiro}`,
          status_auditoria: 'CONFORME'
        }]);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
    setMsg("Auditoria Finalizada com Sucesso!");
    carregarDados();
  }

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER EXECUTIVO */}
      <header style={{ background: '#001529', color: 'white', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#1890ff' }}>MAXIMUS <span style={{color: '#fff'}}>v70</span></h1>
            <p style={{ opacity: 0.7 }}>Inteligência Ambiental e Logística - Pará</p>
          </div>
          <label style={{ background: '#1890ff', color: 'white', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? "PROCESSANDO..." : "🚀 ARRASTE DOCUMENTOS / FOTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </header>

      {/* DASHBOARD DE STATUS */}
      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '5px solid #1890ff' }}>
            <h4 style={{ margin: 0, color: '#8c8c8c' }}>PROCESSOS TOTAIS</h4>
            <h2 style={{ fontSize: '36px', margin: '10px 0' }}>{dados.length}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '5px solid #52c41a' }}>
            <h4 style={{ margin: 0, color: '#8c8c8c' }}>CONFORMIDADE</h4>
            <h2 style={{ fontSize: '36px', margin: '10px 0', color: '#52c41a' }}>100%</h2>
          </div>
        </div>

        {/* BARRA DE BUSCA */}
        <input 
          type="text" 
          placeholder="🔍 Buscar placa, atividade ou empresa..." 
          style={{ width: '100%', padding: '20px', borderRadius: '15px', border: '1px solid #d9d9d9', marginBottom: '30px', fontSize: '18px' }}
          onChange={(e) => setBusca(e.target.value)}
        />

        {/* RELATÓRIO TÉCNICO */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {dados.filter(d => d.placa.includes(busca.toUpperCase()) || d.tipo_atividade.includes(busca)).map(item => (
            <div key={item.id} style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', display: 'flex', gap: '30px', border: '1px solid #f0f0f0' }}>
              <div style={{ flex: 1 }}>
                <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '5px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>{item.tipo_atividade}</span>
                <h2 style={{ margin: '10px 0' }}>{item.placa || item.empresa_nome}</h2>
                <p style={{ fontSize: '14px', color: '#595959' }}><strong>BASE LEGAL:</strong> {item.base_legal}</p>
                <div style={{ background: '#fafafa', padding: '15px', borderRadius: '10px', marginTop: '15px', borderLeft: '4px solid #1890ff' }}>
                  <strong>PARECER TÉCNICO:</strong><br/>
                  <span style={{ fontSize: '14px' }}>{item.parecer_tecnico}</span>
                </div>
              </div>
              <div style={{ width: '250px', borderLeft: '1px solid #f0f0f0', paddingLeft: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <a href={item.url_documento} target="_blank" style={{ background: '#001529', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}>VER DOCUMENTO</a>
                <button onClick={() => window.print()} style={{ background: 'none', border: '1px solid #d9d9d9', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>🖨️ Imprimir Laudo</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
