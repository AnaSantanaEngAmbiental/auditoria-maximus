import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gmhxmtlidgcgpstxiiwg.supabase.co', 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs');

export default function App() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('frota');
  const [filtro, setFiltro] = useState("");

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('licenciamento_ambiental').select('*').order('created_at', { ascending: false });
    setDados(data || []);
  }

  // Função para Gerar Documento (Simulação de preenchimento de Ofício)
  const gerarOficio = (item) => {
    const texto = `
      OFÍCIO Nº ${item.numero_oficio || '___'}/2026 - MAXIMUS
      Ao Senhor Secretário Municipal de Meio Ambiente de ${item.municipio_alvo || 'Marabá'}.
      
      Assunto: Requerimento de Licenciamento Ambiental - ${item.tipo_atividade}
      
      A empresa ${item.empresa_nome}, inscrita no CNPJ ${item.empresa_cnpj}, vem requerer a análise do processo ambiental...
    `;
    const blob = new Blob([texto], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Oficio_${item.placa || item.empresa_nome}.txt`;
    link.click();
  };

  return (
    <div style={{ backgroundColor: '#000b1a', minHeight: '100vh', color: '#e6f1ff', fontFamily: 'Ubuntu, sans-serif' }}>
      
      {/* NAVBAR PHD */}
      <header style={{ borderBottom: '2px solid #00509d', padding: '20px', background: '#001d3d', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, color: '#00a8ff' }}>MAXIMUS v71 <span style={{color: '#fff'}}>PHD ULTRA</span></h1>
          <small>Engenharia Ambiental & TI - Cardoso & Rates</small>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAba('frota')} style={btnStyle(aba === 'frota')}>🚚 FROTA/ANTT</button>
          <button onClick={() => setAba('condicionantes')} style={btnStyle(aba === 'condicionantes')}>⚖️ CONDICIONANTES</button>
          <button onClick={() => setAba('documentos')} style={btnStyle(aba === 'documentos')}>📄 GERAR OFÍCIOS</button>
        </div>
      </header>

      <main style={{ padding: '30px' }}>
        
        {/* BUSCA GLOBAL */}
        <input 
          placeholder="🔎 Pesquisar placa, CNPJ ou atividade..."
          onChange={(e) => setFiltro(e.target.value)}
          style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #00509d', background: '#001d3d', color: 'white', marginBottom: '25px' }}
        />

        {aba === 'frota' && (
          <div style={{ background: '#001d3d', padding: '20px', borderRadius: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ color: '#00a8ff' }}>
                <tr><th>PLACA</th><th>MOTORISTA</th><th>CIV</th><th>CIPP</th><th>ANTT</th><th>DOCS</th></tr>
              </thead>
              <tbody>
                {dados.filter(d => d.placa?.includes(filtro.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #003566', textAlign: 'center' }}>
                    <td><strong>{v.placa}</strong></td>
                    <td>{v.motorista || 'NÃO INFORMADO'}</td>
                    <td style={{color: '#ffc300'}}>{v.validade_civ}</td>
                    <td style={{color: '#ffc300'}}>{v.validade_cipp}</td>
                    <td style={{color: '#00f5d4'}}>{v.status_antt}</td>
                    <td><a href={v.url_documento} target="_blank" style={{color: '#00a8ff'}}>📁</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'condicionantes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <SectionCond title="BÁSICAS (23 itens)" color="#00a8ff" count={23} />
            <SectionCond title="TÉCNICAS (130 itens)" color="#00f5d4" count={130} />
            <SectionCond title="PROJETO (65 itens)" color="#ffc300" count={65} />
            <SectionCond title="DIRETRIZES (180 itens)" color="#ff595e" count={180} />
          </div>
        )}

        {aba === 'documentos' && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {dados.map(item => (
              <div key={item.id} style={{ background: '#fff', color: '#333', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{margin:0}}>{item.empresa_nome}</h3>
                  <p style={{margin:0, fontSize: '12px'}}>Atividade: {item.tipo_atividade}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => gerarOficio(item)} style={btnDoc}>📑 Gerar Ofício</button>
                  <button style={btnDoc}>⚖️ Procuração</button>
                  <button style={btnDoc}>📸 Relat. Fotográfico</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Subcomponentes de Estilo
const SectionCond = ({ title, color, count }) => (
  <div style={{ background: '#001d3d', padding: '20px', borderRadius: '12px', borderLeft: `6px solid ${color}` }}>
    <h3 style={{ color: color, marginTop: 0 }}>{title}</h3>
    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #003566' }}>
          ✅ Item {i + 1}: Descritivo técnico da condicionante de licenciamento SEMAS/PA.
        </div>
      ))}
    </div>
  </div>
);

const btnStyle = (active) => ({
  padding: '10px 20px', background: active ? '#00a8ff' : 'transparent',
  color: active ? '#000' : '#fff', border: '1px solid #00a8ff',
  borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
});

const btnDoc = {
  padding: '8px 15px', background: '#003566', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
};
