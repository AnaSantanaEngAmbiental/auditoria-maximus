import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, AlertCircle, FileText, UploadCloud, Printer } from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const supabaseKey = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MaximusApp() {
  const [itens, setItens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('BASICO');
  const [empresa, setEmpresa] = useState('NOME DA UNIDADE');

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    const { data, error } = await supabase.from('auditoria_maximus').select('*').order('codigo');
    if (data) setItens(data);
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    for (let file of files) {
      const codigoArquivo = file.name.split('_')[0].toUpperCase();
      const itemCorrespondente = itens.find(i => i.codigo === codigoArquivo);

      if (itemCorrespondente) {
        await supabase
          .from('auditoria_maximus')
          .update({ status: 'CONFORME' })
          .eq('codigo', codigoArquivo);
      }
    }
    fetchDados();
    alert("Análise Documental Concluída!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* MENU LATERAL */}
      <aside style={{ width: '280px', backgroundColor: '#064e3b', color: 'white', padding: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic' }}>SiLAM-PA MAXIMUS</h1>
        <p style={{ fontSize: '10px', opacity: 0.7, marginBottom: '40px' }}>SISTEMA DE AUDITORIA Ph.D.</p>
        
        {['BASICO', 'TECNICO', 'PROJETO', 'DIRETRIZ'].map(aba => (
          <button 
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{
              width: '100%', padding: '15px', marginBottom: '10px', border: 'none', borderRadius: '10px',
              backgroundColor: abaAtiva === aba ? '#059669' : 'transparent',
              color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold'
            }}
          >
            {aba}
          </button>
        ))}

        <button 
          onClick={() => window.print()}
          style={{ width: '100%', marginTop: '50px', padding: '15px', backgroundColor: 'white', color: '#064e3b', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Printer size={18} /> GERAR RELATÓRIO
        </button>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <input 
            value={empresa} 
            onChange={(e) => setEmpresa(e.target.value)}
            style={{ fontSize: '24px', fontWeight: 'bold', border: 'none', background: 'transparent' }}
          />
          <label style={{ backgroundColor: '#064e3b', color: 'white', padding: '12px 25px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UploadCloud size={20} /> CARREGAR DOCUMENTOS
            <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>REF</th>
                <th style={{ padding: '15px' }}>DESCRIÇÃO DA CONDICIONANTE</th>
                <th style={{ padding: '15px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {itens.filter(i => i.categoria === abaAtiva).map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#64748b' }}>{item.codigo}</td>
                  <td style={{ padding: '15px', fontSize: '14px', color: '#1e293b' }}>{item.descricao}</td>
                  <td style={{ padding: '15px' }}>
                    {item.status === 'CONFORME' ? 
                      <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16}/> OK</span> : 
                      <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertCircle size={16}/> PENDENTE</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
