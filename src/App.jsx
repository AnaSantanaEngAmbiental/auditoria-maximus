import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Shield, Truck, FileText, Search, AlertCircle, CheckCircle } from 'lucide-react';

const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [condicionantes, setCondicionantes] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState('TODOS');

  useEffect(() => {
    fetchDadosSincronizados();
  }, []);

  async function fetchDadosSincronizados() {
    setLoading(true);
    // Garantindo a leitura de todos os itens (usando range para contornar limites default)
    const { data: condData, error } = await supabase
      .from('base_condicionantes')
      .select('*')
      .range(0, 1000) // Força a leitura de até 1000 linhas para cobrir todos os 417+ itens
      .order('categoria', { ascending: true })
      .order('codigo', { ascending: true });

    const { data: frotaData } = await supabase.from('licenciamento_ambiental').select('*');

    if (condData) setCondicionantes(condData);
    if (frotaData) setFrota(frotaData);
    setLoading(false);
  }

  // REFINAMENTO: Busca inteligente em todos os campos
  const dadosFiltrados = useMemo(() => {
    return condicionantes.filter(item => {
      const matchBusca = (item['descricao de condicionante'] || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (item.codigo?.toString().includes(busca));
      const matchCat = filtroCat === 'TODOS' || item.categoria === filtroCat;
      return matchBusca && matchCat;
    });
  }, [condicionantes, busca, filtroCat]);

  const updateStatus = async (id, novoStatus) => {
    const { error } = await supabase.from('base_condicionantes').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      setCondicionantes(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus } : c));
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'20%'}}><h2>⚙️ MAXIMUS v74: Mapeando {condicionantes.length} itens...</h2></div>;

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f0f4f4', minHeight: '100vh' }}>
      {/* HEADER TÉCNICO */}
      <header style={{ background: '#004d40', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <div>
          <h2 style={{margin:0}}>MAXIMUS v74 <span style={{fontSize:'12px', fontWeight:'normal'}}>| PhD Compliance</span></h2>
          <small>Total Processado: {condicionantes.length} Condicionantes</small>
        </div>
        <div style={{display:'flex', gap:'15px'}}>
           <div style={{background:'#fff', borderRadius:'5px', padding:'5px 10px', display:'flex', alignItems:'center'}}>
              <Search size={16} color="#000" />
              <input 
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar código ou descrição..." 
                style={{border:'none', outline:'none', marginLeft:'8px', width:'250px'}}
              />
           </div>
        </div>
      </header>

      <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
        {/* TABELA PRINCIPAL AUDITÁVEL */}
        <div style={{ flex: 3, background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <h3>📋 Auditoria de Condicionantes</h3>
            <div style={{display:'flex', gap:'5px'}}>
              {['TODOS', 'BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setFiltroCat(cat)}
                  style={{
                    padding:'6px 12px', borderRadius:'15px', border:'1px solid #004d40', cursor:'pointer',
                    background: filtroCat === cat ? '#004d40' : '#fff',
                    color: filtroCat === cat ? '#fff' : '#004d40',
                    fontSize: '11px', fontWeight: 'bold'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
            <table width="100%" style={{ borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#e0f2f1', zIndex: 1 }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Cód</th>
                  <th>Categoria</th>
                  <th>Descrição Técnica (Fiel ao CSV)</th>
                  <th>Status de Auditoria</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.codigo}</td>
                    <td><span style={{fontSize:'10px', background:'#eee', padding:'2px 6px', borderRadius:'4px'}}>{item.categoria}</span></td>
                    <td style={{ fontSize: '13px', padding: '12px', color: '#333' }}>{item['descricao de condicionante']}</td>
                    <td>
                      <select 
                        value={item.status || 'PENDENTE'} 
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        style={{
                          padding: '6px', borderRadius: '4px', border: '1px solid #ccc',
                          background: item.status === 'CONFORME' ? '#c8e6c9' : '#fff9c4'
                        }}
                      >
                        <option value="PENDENTE">🟡 Pendente</option>
                        <option value="CONFORME">🟢 Conforme</option>
                        <option value="NAO_CONFORME">🔴 Não Conforme</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAINEL DE FROTA E ESTATÍSTICAS */}
        <div style={{ flex: 1, display:'flex', flexDirection:'column', gap:'20px' }}>
          <div style={{ background: '#004d40', color: '#fff', padding: '20px', borderRadius: '10px' }}>
            <h4>📊 Resumo PhD</h4>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px'}}>
              <span>Conformidade:</span>
              <strong>{Math.round((condicionantes.filter(c => c.status === 'CONFORME').length / condicionantes.length) * 100) || 0}%</strong>
            </div>
            <div style={{width:'100%', height:'8px', background:'rgba(255,255,255,0.2)', borderRadius:'4px', marginTop:'5px'}}>
               <div style={{width: `${(condicionantes.filter(c => c.status === 'CONFORME').length / condicionantes.length) * 100}%`, height:'100%', background:'#25d366', borderRadius:'4px'}}></div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h4>🚛 Gestão de Frota</h4>
            {frota.map(v => (
              <div key={v.id} style={{padding:'10px', borderBottom:'1px solid #f0f0f0', fontSize:'12px'}}>
                <strong>{v.placa}</strong> - CIV: {v.validade_civ}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
