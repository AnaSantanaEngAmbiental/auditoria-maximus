import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gmhxmtlidgcgpstxiiwg.supabase.co', 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs');

export default function App() {
  const [dados, setDados] = useState([]);
  const [aba, setAba] = useState('frota');
  const [selecionado, setSelecionado] = useState(null);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data } = await supabase.from('licenciamento_ambiental').select('*').order('created_at', { ascending: false });
    setDados(data || []);
  }

  // GERADOR DE RELATÓRIO FOTOGRÁFICO
  const abrirRelatorioFotografico = (item) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Relatório Fotográfico - ${item.empresa_nome}</title></head>
        <style>
          body { font-family: Arial; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; }
          .foto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .foto-item { border: 1px solid #ccc; padding: 10px; text-align: center; }
          img { max-width: 100%; height: 250px; object-fit: cover; }
        </style>
        <body>
          <div class="header"><h1>RELATÓRIO FOTOGRÁFICO AMBIENTAL</h1><p>${item.empresa_nome} - Atividade: ${item.tipo_atividade}</p></div>
          <div class="foto-grid">
            <div class="foto-item"><img src="${item.url_documento}"> <p><b>Registro 01:</b> Aspectos gerais da área de operação e conformidade técnica.</p></div>
            <div class="foto-item"><img src="${item.url_documento}"> <p><b>Registro 02:</b> Verificação de sistemas de controle ambiental (SAO/PGRS).</p></div>
          </div>
        </body>
      </html>
    `);
  };

  return (
    <div style={{ backgroundColor: '#000814', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER REFORMULADO */}
      <nav style={{ background: '#001d3d', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #003566' }}>
        <div>
          <h1 style={{ color: '#ffc300', margin: 0 }}>MAXIMUS <span style={{color:'#fff'}}>PHD v72</span></h1>
          <span style={{fontSize: '12px', opacity: 0.7}}>Sistema de Alta Performance em Engenharia Ambiental</span>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setAba('frota')} style={tabBtn(aba === 'frota')}>🚚 FROTA</button>
          <button onClick={() => setAba('condicionantes')} style={tabBtn(aba === 'condicionantes')}>⚖️ CONDICIONANTES</button>
          <button onClick={() => setAba('documentos')} style={tabBtn(aba === 'documentos')}>📄 DOCUMENTOS</button>
        </div>
      </nav>

      <main style={{ padding: '40px' }}>
        {aba === 'frota' && (
          <section style={{ background: '#001d3d', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#003566', color: '#ffc300' }}>
                <tr style={{ height: '50px' }}><th>PLACA</th><th>STATUS ANTT</th><th>CIV</th><th>CIPP</th><th>AÇÕES</th></tr>
              </thead>
              <tbody>
                {dados.map(v => (
                  <tr key={v.id} style={{ textAlign: 'center', borderBottom: '1px solid #003566' }}>
                    <td style={{ padding: '15px' }}><b>{v.placa}</b></td>
                    <td style={{ color: '#00f5d4' }}>{v.status_antt}</td>
                    <td>{v.validade_civ || 'PENDENTE'}</td>
                    <td>{v.validade_cipp || 'PENDENTE'}</td>
                    <td><a href={v.url_documento} target="_blank" style={{color: '#ffc300'}}>📁 Abrir</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {aba === 'condicionantes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <CondCard title="BÁSICAS" count={23} color="#00a8ff" />
            <CondCard title="TÉCNICAS" count={130} color="#00f5d4" />
            <CondCard title="PROJETO" count={65} color="#ffc300" />
            <CondCard title="DIRETRIZES" count={180} color="#ff595e" />
          </div>
        )}

        {aba === 'documentos' && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {dados.map(item => (
              <div key={item.id} style={{ background: '#fff', color: '#000', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{margin:0}}>{item.empresa_nome}</h3>
                  <p style={{margin:0, opacity: 0.6}}>{item.tipo_atividade}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={actionBtn} onClick={() => alert('Gerando Ofício Requerimento...')}>📑 OFÍCIO</button>
                  <button style={actionBtn}>⚖️ PROCURAÇÃO</button>
                  <button style={actionBtn} onClick={() => abrirRelatorioFotografico(item)}>📸 RELAT. FOTOGRÁFICO</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENTES DE INTERFACE
const CondCard = ({ title, count, color }) => (
  <div style={{ background: '#001d3d', padding: '20px', borderRadius: '12px', borderTop: `4px solid ${color}` }}>
    <h4 style={{ color: color, margin: '0 0 15px 0' }}>{title} ({count} itens)</h4>
    <div style={{ height: '250px', overflowY: 'auto', fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '10px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ marginBottom: '8px', opacity: 0.8 }}>
          <input type="checkbox" checked readOnly /> Item ${i + 1}: Diretriz técnica PhD para licenciamento.
        </div>
      ))}
    </div>
  </div>
);

const tabBtn = (active) => ({
  padding: '10px 25px', background: active ? '#ffc300' : 'transparent',
  color: active ? '#000' : '#fff', border: active ? 'none' : '1px solid #ffc300',
  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'
});

const actionBtn = {
  padding: '10px 15px', background: '#003566', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
};
