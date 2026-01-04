import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
    // Busca os dados da tabela que você importou
    const { data: dataCond, error } = await supabase
      .from('base_condicionantes')
      .select('*');

    if (error) console.error("Erro ao buscar:", error);
    
    const { data: dataFrota } = await supabase.from('licenciamento_ambiental').select('*');

    if (dataCond) setCondicionantes(dataCond);
    if (dataFrota) setFrota(dataFrota);
    setLoading(false);
  }

  if (loading) return <div>Carregando Base Maximus v74...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>MAXIMUS v74 - Checklist PhD</h1>
      
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#004d40', color: 'white' }}>
            <th>Cód</th>
            <th>Categoria</th>
            <th>Descrição da Condicionante</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {condicionantes.map((item) => (
            <tr key={item.id}>
              <td>{item.codigo}</td>
              <td><b>{item.categoria}</b></td>
              {/* ATENÇÃO AQUI: Usando o nome EXATO que o Supabase aceitou */}
              <td>{item['descricao de condicionante']}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
