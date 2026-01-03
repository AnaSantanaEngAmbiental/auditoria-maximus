import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, AlertCircle, Printer, Lock, Search } from 'lucide-react';

const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co'; 
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AplicativoMaximus() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('BÁSICA');
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (autorizado) buscarDados();
  }, [autorizado]);

  async function buscarDados() {
    const { data, error } = await supabase
      .from('auditoria_maximus')
      .select('*')
      // Ajustado para 'codigo' sem acento para compatibilidade total
      .order('codigo', { ascending: true });
    
    if (data) setItens(data);
    if (error) console.error("Erro Supabase:", error);
  }

  if (!autorizado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
        <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Lock size={48} style={{ marginBottom: '15px', color: '#004a99' }} />
          <h2 style={{ color: '#333', marginBottom: '5px' }}>SILAM</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Sistema Integrado de Auditoria</p>
          <input 
            type="password" 
            placeholder="Senha de Acesso" 
            value={senhaInput}
            onChange={(e) => setSenhaInput(e.target.value)}
            style={{ padding: '12px', width: '250px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '16px' }}
          />
          <br />
          <button 
            onClick={() => senhaInput === 'maximus2026' ? setAutorizado(true) : alert('Senha incorreta!')}
            style={{ padding: '12px 50px', backgroundColor: '#004a99', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  // Filtro inteligente que ignora acentos na busca e na categoria
  const itensFiltrados = itens.filter(i => {
    const catBanco = (i.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const catAba = abaAtiva.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Tenta ler 'descricao de condicionante' ou 'descriçãodecondicionante' (o que o CSV gerar)
    const descricao = (i['descricao de condicionante'] || i['descriçãodecondicionante'] || "").toLowerCase();
    
    return catBanco === catAba && descricao.includes(filtro.toLowerCase());
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #004a99', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ color: '#004a99', margin: 0 }}>SILAM - Auditoria</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Gestão de Condicionantes Ambientais</p>
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}>
          <Printer size={18}/> Imprimir Relatório
        </button>
      </header>

      <nav style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px' }}>
        {['BÁSICA', 'TÉCNICA', 'PROJETO', 'DIRETRIZ'].map(aba => (
          <button 
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{ 
              padding: '12px 25px', 
              backgroundColor: abaAtiva === aba ? '#004a99' : '#fff', 
              color: abaAtiva === aba ? 'white' : '#555', 
              border: '2px solid #004a99', 
              borderRadius: '10px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {aba}
          </button>
        ))}
      </nav>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} size={20} />
        <input 
          type="text"
          placeholder="Pesquisar condicionante..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '16px' }}
        />
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#004a99', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '15px', width: '80px' }}>ID</th>
              <th style={{ padding: '15px' }}>DESCRIÇÃO DA CONDICIONANTE</th>
              <th style={{ padding: '15px', width: '150px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((item, index) => (
              <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fbff', borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#004a99' }}>{item.codigo}</td>
                <td style={{ padding: '15px', lineHeight: '1.5', fontSize: '14px', textAlign: 'justify' }}>
                  {item['descricao de condicionante'] || item['descriçãodecondicionante']}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: item.status === 'CONFORME' ? '#e6f4ea' : '#fce8e6',
                    color: item.status === 'CONFORME' ? '#1e7e34' : '#d93025',
                    width: 'fit-content'
                  }}>
                    {item.status === 'CONFORME' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} 
                    {item.status || 'PENDENTE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {itensFiltrados.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center', color: '#999' }}>
            Nenhum dado encontrado. Verifique se a coluna 'categoria' no Supabase está preenchida corretamente.
          </div>
        )}
      </div>
    </div>
  );
}
