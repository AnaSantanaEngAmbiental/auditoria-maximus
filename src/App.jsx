import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gmhxmtlidgcgpstxiiwg.supabase.co', 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs');

export default function App() {
  const [dados, setDados] = useState([]);
  const [condicionantes, setCondicionantes] = useState([]);
  const [aba, setAba] = useState('dashboard');
  const [chatInput, setChatInput] = useState("");
  const [chatResp, setChatResp] = useState("");

  useEffect(() => { 
    carregarDados();
    carregarCondicionantes();
  }, []);

  async function carregarDados() {
    const { data } = await supabase.from('licenciamento_ambiental').select('*');
    setDados(data || []);
  }

  async function carregarCondicionantes() {
    const { data } = await supabase.from('base_condicionantes').select('*').order('item_numero');
    setCondicionantes(data || []);
  }

  // Sugestão 10: Chatbot com Base Real
  const handleChat = async () => {
    const { data } = await supabase.from('base_conhecimento_phd')
      .select('resposta_tecnica')
      .ilike('pergunta', `%${chatInput}%`)
      .single();
    setChatResp(data ? data.resposta_tecnica : "Consultando normas da SEMAS/PA... Tente termos como 'Posto' ou 'Transporte'.");
  };

  return (
    <div style={{ backgroundColor: '#000814', minHeight: '100vh', color: '#fff', fontFamily: 'Ubuntu' }}>
      
      {/* NAVBAR v74 PHD */}
      <nav style={{ background: '#001d3d', padding: '20px', borderBottom: '4px solid #00f5d4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#ffc300' }}>MAXIMUS v74 <span style={{color:'#fff'}}>ULTRA</span></h1>
          <small style={{color: '#00f5d4'}}>SISTEMA DE ALTA PERFORMANCE AMBIENTAL</small>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setAba('dashboard')} style={btnTab(aba === 'dashboard')}>📊 GESTÃO</button>
          <button onClick={() => setAba('condicionantes')} style={btnTab(aba === 'condicionantes')}>⚖️ CHECKLIST 398</button>
          <button onClick={() => setAba('docs')} style={btnTab(aba === 'docs')}>📄 OFÍCIOS/LAUDOS</button>
          <button onClick={() => setAba('chat')} style={btnTab(aba === 'chat')}>🤖 PHD CHAT</button>
        </div>
      </nav>

      <main style={{ padding: '30px' }}>
        
        {/* ABA DASHBOARD: FROTA E ALERTAS */}
        {aba === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div style={{ background: '#001d3d', padding: '25px', borderRadius: '15px' }}>
              <h3 style={{color: '#ffc300'}}>🚚 Monitoramento ANTT/CIV/CIPP</h3>
              <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
                <thead style={{ color: '#00f5d4', borderBottom: '1px solid #00f5d4' }}>
                  <tr style={{ textAlign: 'left' }}><th>PLACA</th><th>STATUS</th><th>VENCIMENTOS</th><th>AÇÃO</th></tr>
                </thead>
                <tbody>
                  {dados.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #003566' }}>
                      <td style={{ padding: '12px' }}>{v.placa}</td>
                      <td style={{ color: '#00ff00' }}>{v.status_antt}</td>
                      <td>CIV: {v.validade_civ}</td>
                      <td>
                        <button style={btnAction} onClick={() => window.open(`https://wa.me/55${v.telefone_cliente}`)}>📲 Avisar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: '#001d3d', padding: '25px', borderRadius: '15px' }}>
              <h3 style={{color: '#ffc300'}}>💰 Taxas SEMAS (Est.)</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00f5d4' }}>R$ 14.850,00</div>
              <small>Valor acumulado de processos ativos</small>
            </div>
          </div>
        )}

        {/* ABA CONDICIONANTES: OS 398 ITENS REALISTAS */}
        {aba === 'condicionantes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {['BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
              <div key={cat} style={{ background: '#001d3d', padding: '20px', borderRadius: '12px', borderTop: '4px solid #00f5d4' }}>
                <h4 style={{ color: '#ffc300' }}>{cat}</h4>
                <div style={{ height: '300px', overflowY: 'auto' }}>
                  {condicionantes.filter(c => c.categoria === cat).map(item => (
                    <div key={item.id} style={{ fontSize: '12px', padding: '8px 0', borderBottom: '1px dotted #003566' }}>
                      <input type="checkbox" /> {item.item_numero}. {item.descricao}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA CHATBOT: CONSULTA TÉCNICA */}
        {aba === 'chat' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', background: '#001d3d', padding: '30px', borderRadius: '20px' }}>
            <h2>🤖 Consultoria PhD em Tempo Real</h2>
            <input 
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', marginBottom: '10px' }}
              placeholder="Digite sua dúvida técnica (ex: Posto, Laticínio, ANTT)..."
              value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            />
            <button style={{ width: '100%', padding: '15px', background: '#ffc300', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }} onClick={handleChat}>CONSULTAR BASE LEGAL</button>
            {chatResp && <div style={{ marginTop: '20px', padding: '20px', background: '#003566', borderRadius: '10px', borderLeft: '5px solid #00f5d4' }}>{chatResp}</div>}
          </div>
        )}

      </main>
    </div>
  );
}

// Estilos Dinâmicos
const btnTab = (active) => ({ padding: '10px 20px', background: active ? '#ffc300' : 'transparent', color: active ? '#000' : '#fff', border: active ? 'none' : '1px solid #ffc300', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' });
const btnAction = { background: '#004b23', color: '#00f5d4', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };
