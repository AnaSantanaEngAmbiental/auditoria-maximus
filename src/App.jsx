import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, AlertCircle, Printer, Lock } from 'lucide-react';

// --- CONFIGURAÇÃO ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AplicativoMaximus() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('BÁSICO');
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');

  // Busca os dados da tabela
  useEffect(() => {
    if (autorizado) buscarDados();
  }, [autorizado]);

  async function buscarDados() {
    // Busca na tabela 'auditoria_maximus' e ordena pelo campo 'codigo'
    const { data, error } = await supabase
      .from('auditoria_maximus')
      .select('*')
      .order('codigo');
    
    if (data) {
      setItens(data);
    } else if (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }

  // TELA DE LOGIN
  if (!autorizado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
        <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Lock size={48} style={{ marginBottom: '10px', color: '#1a73e8' }} />
          <h2>Acesso Restrito</h2>
          <p>Sistema Auditoria Maximus</p>
          <input 
            type="password" 
            placeholder="Digite a senha" 
            value={senhaInput}
            onChange={(e) => setSenhaInput(e.target.value)}
            style={{ padding: '12px', width: '200px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '15px' }}
          />
          <br />
          <button 
            onClick={() => senhaInput === 'maximus2024' ? setAutorizado(true) : alert('Senha incorreta!')}
            style={{ padding: '12px 30px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Entrar no Sistema
          </button>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (APÓS LOGIN)
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', marginBottom: '20px', paddingBottom: '10px' }}>
        <h1 style={{ color: '#333' }}>MAXIMUS v15 - Auditoria</h1>
        <button 
          onClick={() => window.print()} 
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '5px' }}
        >
          <Printer size={18}/> Imprimir
        </button>
      </header>

      <nav style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        {['BÁSICO', 'TÉCNICA', 'PROJETO', 'DIRETRIZES'].map(aba => (
          <button 
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: abaAtiva === aba ? '#1a73e8' : '#e0e0e0', 
              color: abaAtiva === aba ? 'white' : 'black', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {aba}
          </button>
        ))}
      </nav>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>CÓDIGO</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>DESCRIÇÃO</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {itens
              .filter(i => i.categoria === abaAtiva)
              .map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  {/* Ajustado para 'codigo' sem acento conforme sua tabela */}
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.codigo}</td>
                  
                  {/* Ajustado para 'descricao' sem acento conforme sua tabela */}
                  <td style={{ padding: '12px' }}>{item.descricao}</td>
                  
                  <td style={{ 
                    padding: '12px', 
                    color: item.status === 'CONFORME' ? '#28a745' : '#dc3545', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {item.status === 'CONFORME' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} 
                    {item.status}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        
        {/* Aviso caso a categoria esteja vazia */}
        {itens.filter(i => i.categoria === abaAtiva).length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9f9f9', marginTop: '10px' }}>
            Nenhum item encontrado na categoria <strong>{abaAtiva}</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
