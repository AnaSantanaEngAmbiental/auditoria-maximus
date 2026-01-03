import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, AlertCircle, FileText, UploadCloud, Printer, Lock } from 'lucide-react';

// --- CONFIGURAÇÃO (COLOQUE SUAS CHAVES AQUI) ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AplicativoMaximus() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('BÁSICO');
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');

  // Busca os dados da tabela que você criou
  useEffect(() => {
    if (autorizado) buscarDados();
  }, [autorizado]);

  async function buscarDados() {
    const { data } = await supabase.from('auditório_máximo').select('*').order('código');
    if (data) setItens(data);
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
            style={{ padding: '12px 30px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <h1>MAXIMUS v15 - Auditoria</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px', cursor: 'pointer' }}><Printer size={18}/> Imprimir</button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['BÁSICO', 'MÁQUINAS', 'ELÉTRICA', 'SOCIAL'].map(aba => (
          <button 
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{ padding: '10px 20px', backgroundColor: abaAtiva === aba ? '#1a73e8' : '#e0e0e0', color: abaAtiva === aba ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {aba}
          </button>
        ))}
      </nav>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>CÓDIGO</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>DESCRIÇÃO</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {itens.filter(i => i.tímpano === abaAtiva).map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{item.código}</td>
              <td style={{ padding: '12px' }}>{item.descrição}</td>
              <td style={{ padding: '12px', color: item.status === 'CONFORME' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                {item.status === 'CONFORME' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
