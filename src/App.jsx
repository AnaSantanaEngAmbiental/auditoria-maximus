import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Suas credenciais mantidas
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; // Nota: use variáveis de ambiente na Vercel por segurança
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [condicionantes, setCondicionantes] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      
      // Busca condicionantes
      const { data: dataCond, error: errorCond } = await supabase
        .from('base_condicionantes')
        .select('*');

      if (errorCond) throw errorCond;

      // Busca frota
      const { data: dataFrota, error: errorFrota } = await supabase
        .from('licenciamento_ambiental')
        .select('*');

      if (errorFrota) console.warn("Frota ainda vazia ou erro:", errorFrota);

      setCondicionantes(dataCond || []);
      setFrota(dataFrota || []);
    } catch (err) {
      console.error("Erro PhD Maximus:", err.message);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <h2>⚙️ Carregando Base Maximus v74...</h2>
    </div>
  );

  if (erro) return (
    <div style={{ color: 'red', padding: '20px' }}>
      <h3>❌ Erro de Conexão:</h3>
      <p>{erro}</p>
      <button onClick={() => window.location.reload()}>Tentar Novamente</button>
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#004d40', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1>MAXIMUS v74 - Checklist PhD</h1>
        <p>Dados integrados dos arquivos: Básico, Técnico, Projetos e Diretrizes</p>
      </header>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }} border="1">
          <thead>
            <tr style={{ backgroundColor: '#00796b', color: 'white' }}>
              <th style={{ padding: '10px' }}>Cód</th>
              <th style={{ padding: '10px' }}>Categoria</th>
              <th style={{ padding: '10px' }}>Descrição da Condicionante</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* O SEGREDO: condicionantes?.map evita a tela branca se o array estiver vazio */}
            {condicionantes?.length > 0 ? (
              condicionantes.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.codigo}</td>
                  <td style={{ padding: '8px' }}><b>{item.categoria}</b></td>
                  {/* Acessando a coluna com espaços exatamente como você salvou */}
                  <td style={{ padding: '8px' }}>{item['descricao de condicionante']}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.status || 'PENDENTE'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>
                  Nenhum dado encontrado. Verifique se a tabela 'base_condicionantes' tem dados no Supabase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
