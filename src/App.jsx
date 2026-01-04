import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Conecta ao seu projeto específico
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [condicionantes, setCondicionantes] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    setLoading(true);
    // Busca dados da tabela base_condicionantes
    const { data: dataCond } = await supabase
      .from('base_condicionantes')
      .select('*')
      .order('codigo', { ascending: true });
    
    // Busca dados da tabela licenciamento_ambiental (Frota)
    const { data: dataFrota } = await supabase.from('licenciamento_ambiental').select('*');

    if (dataCond) setCondicionantes(dataCond);
    if (dataFrota) setFrota(dataFrota);
    setLoading(false);
  }

  // Função para Gerar Relatório PDF
  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Auditoria Ambiental - Cardoso & Rates", 14, 15);
    
    const tableData = condicionantes.map(item => [
      item.codigo,
      item.categoria,
      item['descricao de condicionante'], // Nome exato da coluna do CSV
      item.status || 'PENDENTE'
    ]);

    doc.autoTable({
      head: [['Cód', 'Categoria', 'Descrição', 'Status']],
      body: tableData,
      startY: 20
    });

    doc.save('Relatorio_Maximus_v74.pdf');
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}><h1>⚙️ Carregando Base Maximus v74...</h1></div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004d40', color: 'white', padding: '15px', borderRadius: '8px' }}>
        <h1>MAXIMUS v74 - Auditoria PhD</h1>
        <button onClick={gerarPDF} style={{ padding: '10px 20px', backgroundColor: '#ffc107', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          📄 GERAR RELATÓRIO PDF
        </button>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Painel de Condicionantes */}
        <div style={{ flex: 2, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>📋 Checklist Ambiental</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#00796b', color: 'white' }}>
                <th>Cód</th>
                <th>Categoria</th>
                <th>Descrição da Condicionante</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {condicionantes.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.codigo}</td>
                  <td style={{ padding: '8px' }}><b>{item.categoria}</b></td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{item['descricao de condicionante']}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.status || 'CONFORME'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Painel Lateral de Frota */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #004d40' }}>
          <h3>🚛 Controle de Frota</h3>
          {frota.length > 0 ? frota.map(v => (
            <div key={v.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
              <strong>Placa: {v.placa}</strong><br/>
              <small>CIV: {v.validade_civ} | CIPP: {v.validade_cipp}</small>
            </div>
          )) : <p>Nenhum veículo cadastrado.</p>}
        </div>
      </div>
    </div>
  );
};

export default App;
