import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [condicionantes, setCondicionantes] = useState([]);
  const [frota, setFrota] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    setLoading(true);
    const { data: cond } = await supabase.from('base_condicionantes').select('*').order('codigo', { ascending: true });
    const { data: frotaData } = await supabase.from('licenciamento_ambiental').select('*');
    if (cond) setCondicionantes(cond);
    if (frotaData) setFrota(frotaData);
    setLoading(false);
  }

  // 1. ANALISE E AUDITORIA: Atualiza status no Banco
  async function atualizarStatus(id, novoStatus) {
    const { error } = await supabase
      .from('base_condicionantes')
      .update({ status: novoStatus })
      .eq('id', id);

    if (!error) {
      setCondicionantes(condicionantes.map(item => item.id === id ? { ...item, status: novoStatus } : item));
    }
  }

  // 2. RELATÓRIO: Gera PDF dos itens auditados
  const gerarRelatorioPDF = () => {
    const doc = new jsPDF();
    doc.text("RELATÓRIO DE AUDITORIA AMBIENTAL - MAXIMUS v74", 14, 15);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = condicionantes.map(item => [
      item.codigo,
      item.categoria,
      item['descricao de condicionante'],
      item.status
    ]);

    doc.autoTable({
      head: [['Cód', 'Categoria', 'Descrição', 'Status']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save('Relatorio_Auditoria_CardosoRates.pdf');
  };

  // 3. FROTA: Upload de Documentos
  const handleUpload = async (e, placa) => {
    const file = e.target.files[0];
    const filePath = `frotas/${placa}_${file.name}`;
    const { error } = await supabase.storage.from('processos-ambientais').upload(filePath, file);
    
    if (!error) {
      alert(`Documento da placa ${placa} enviado para análise PhD!`);
      fetchDados();
    }
  };

  const dadosFiltrados = filtro === 'TODOS' ? condicionantes : condicionantes.filter(c => c.categoria === filtro);

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}><h1>⚙️ Carregando Inteligência Maximus...</h1></div>;

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f4', minHeight: '100vh' }}>
      {/* HEADER */}
      <header style={{ backgroundColor: '#004d40', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{margin:0}}>MAXIMUS v74</h1>
          <small>Auditoria & Compliance Ambiental - Cardoso & Rates</small>
        </div>
        <button onClick={gerarRelatorioPDF} style={{ padding: '10px 20px', backgroundColor: '#ffc107', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          📄 GERAR RELATÓRIO PDF
        </button>
      </header>

      {/* FILTROS */}
      <div style={{ padding: '20px', display: 'flex', gap: '10px', justifyContent: 'center', backgroundColor: '#fff', borderBottom: '1px solid #ccc' }}>
        {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #004d40', cursor: 'pointer', backgroundColor: filtro === cat ? '#004d40' : 'white', color: filtro === cat ? 'white' : '#004d40' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
        {/* COLUNA CHECKLIST (398 ITENS) */}
        <div style={{ flex: 2, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2>📋 Auditoria de Condicionantes</h2>
          <table width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e0f2f1', textAlign: 'left' }}>
                <th>Cód</th>
                <th>Descrição</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{item.codigo}</td>
                  <td style={{ fontSize: '14px' }}>{item['descricao de condicionante']}</td>
                  <td>
                    <select 
                      value={item.status || 'PENDENTE'} 
                      onChange={(e) => atualizarStatus(item.id, e.target.value)}
                      style={{ padding: '5px', borderRadius: '4px', border: `2px solid ${item.status === 'CONFORME' ? 'green' : 'orange'}` }}
                    >
                      <option value="PENDENTE">🟡 Pendente</option>
                      <option value="CONFORME">🟢 Conforme</option>
                      <option value="N/A">⚪ N/A</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* COLUNA FROTA */}
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #004d40' }}>
          <h2>🚛 Frota & Documentos</h2>
          {frota.map(v => (
            <div key={v.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
              <strong>Placa: {v.placa}</strong>
              <p style={{fontSize: '12px', margin: '5px 0'}}>CIV: {v.validade_civ || 'Pendente'} | CIPP: {v.validade_cipp || 'Pendente'}</p>
              <input type="file" onChange={(e) => handleUpload(e, v.placa)} style={{fontSize: '10px'}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
