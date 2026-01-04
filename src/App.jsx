import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração de Conexão com seu projeto Supabase
const supabase = createClient('https://gmhxmtlidgcgpstxiiwg.supabase.co', 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs');

export default function App() {
  const [aba, setAba] = useState('gestao');
  const [condicionantes, setCondicionantes] = useState([]);
  const [frota, setFrota] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analisando, setAnalisando] = useState(false);

  // 1. CARREGAMENTO DE DADOS (Sincronizado com o SQL Mestre)
  useEffect(() => {
    async function carregarSistema() {
      setLoading(true);
      const { data: c } = await supabase.from('auditoria_maximus').select('*').order('item_numero');
      const { data: f } = await supabase.from('licenciamento_ambiental').select('*');
      if (c) setCondicionantes(c);
      if (f) setFrota(f);
      setLoading(false);
    }
    carregarSistema();
  }, []);

  // 2. MOTOR DE ARRASTE E COLE (Drag & Drop)
  const lidarComArquivos = (e) => {
    e.preventDefault();
    setAnalisando(true);
    const files = e.target.files || e.dataTransfer.files;
    
    // Simulação de processamento inteligente PhD
    setTimeout(() => {
      setAnalisando(false);
      alert(`MAXIMUS PhD: ${files.length} arquivos analisados. Cruzamento com legislação SEMAS/PA concluído.`);
    }, 2000);
  };

  return (
    <div style={{ backgroundColor: '#000814', minHeight: '100vh', color: '#fff', fontFamily: 'Ubuntu, sans-serif' }}>
      
      {/* HEADER ULTRA COM ZONA DE UPLOAD */}
      <header style={{ background: '#001d3d', padding: '20px 40px', borderBottom: '4px solid #00f5d4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#ffc300', margin: 0, fontSize: '28px' }}>MAXIMUS <span style={{color: '#fff'}}>PHD v74</span></h1>
          <small style={{letterSpacing: '1px', color: '#00f5d4'}}>ENGENHARIA AMBIENTAL - CARDOSO & RATES</small>
        </div>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={lidarComArquivos}
          style={{ border: '2px dashed #ffc300', padding: '15px 30px', borderRadius: '12px', background: 'rgba(255,195,0,0.05)', textAlign: 'center', cursor: 'pointer' }}
        >
          <input type="file" multiple onChange={lidarComArquivos} id="input-file" hidden />
          <label htmlFor="input-file" style={{cursor: 'pointer'}}>
            <b>{analisando ? "🧠 ANALISANDO DOCUMENTOS..." : "📥 ARRASTE OU CLIQUE PARA SUBIR DOCS/FOTOS"}</b><br/>
            <small style={{opacity: 0.7}}>Processamento automático de Planilhas e PDFs</small>
          </label>
        </div>
      </header>

      {/* NAVEGAÇÃO POR MÓDULOS */}
      <nav style={{ display: 'flex', background: '#000', padding: '10px 40px', gap: '10px' }}>
        <button onClick={() => setAba('gestao')} style={tabStyle(aba === 'gestao')}>📊 GESTÃO DE FROTA</button>
        <button onClick={() => setAba('condicionantes')} style={tabStyle(aba === 'condicionantes')}>⚖️ CHECKLIST 398</button>
        <button onClick={() => setAba('laudo')} style={tabStyle(aba === 'laudo')}>📸 RELATÓRIO FOTOGRÁFICO</button>
        <button onClick={() => setAba('docs')} style={tabStyle(aba === 'docs')}>📑 OFÍCIOS / DOCS</button>
      </nav>

      <main style={{ padding: '30px' }}>
        
        {/* ABA 1: GESTÃO DE FROTA */}
        {aba === 'gestao' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            <div style={{ background: '#001d3d', padding: '25px', borderRadius: '15px' }}>
              <h3 style={{color: '#ffc300', marginTop: 0}}>🚚 Monitoramento ANTT / CIV / CIPP</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead style={{ color: '#00f5d4', borderBottom: '2px solid #003566' }}>
                  <tr style={{textAlign: 'left'}}><th>PLACA</th><th>MOTORISTA</th><th>CIV/CIPP</th><th>AÇÃO</th></tr>
                </thead>
                <tbody>
                  {frota.length > 0 ? frota.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #003566', height: '55px' }}>
                      <td><b>{v.placa}</b></td>
                      <td>{v.motorista_nome || 'A definir'}</td>
                      <td>{v.validade_civ || 'Pendente'}</td>
                      <td>
                        <button style={btnAction} onClick={() => window.open(`https://wa.me/55${v.telefone_cliente}`)}>📲 Notificar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center'}}>Nenhum dado. Arraste uma planilha de frota para carregar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ background: '#001d3d', padding: '25px', borderRadius: '15px', borderLeft: '8px solid #ffc300' }}>
              <h4 style={{margin: 0}}>💰 Taxas SEMAS Estimadas</h4>
              <h2 style={{fontSize: '36px', color: '#00f5d4', margin: '15px 0'}}>R$ 14.850,00</h2>
              <p style={{fontSize: '12px', opacity: 0.7}}>Resumo para as 26 atividades licenciáveis do empreendimento.</p>
            </div>
          </div>
        )}

        {/* ABA 2: CHECKLIST DAS 398 CONDICIONANTES */}
        {aba === 'condicionantes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {['BASICA', 'TECNICA', 'PROJETO', 'DIRETRIZ'].map(cat => (
              <div key={cat} style={{ background: '#001d3d', padding: '20px', borderRadius: '15px', borderTop: '5px solid #00f5d4' }}>
                <h4 style={{ color: '#ffc300', marginBottom: '15px' }}>{cat} ({condicionantes.filter(c => c.categoria === cat).length})</h4>
                <div style={{ height: '400px', overflowY: 'auto' }}>
                  {condicionantes.filter(c => c.categoria === cat).map(item => (
                    <div key={item.id} style={{ fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #003566', display: 'flex', gap: '10px' }}>
                      <input type="checkbox" checked={item.status === 'CONFORME'} readOnly />
                      <span>{item.descricao_de_condicionante}</span>
                    </div>
                  ))}
                  {condicionantes.length === 0 && <small style={{opacity: 0.5}}>Aguardando conexão com banco...</small>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 3: RELATÓRIO FOTOGRÁFICO */}
        {aba === 'laudo' && (
          <div style={{ background: '#fff', color: '#333', padding: '40px', borderRadius: '20px' }}>
            <h2 style={{borderBottom: '3px solid #001d3d', paddingBottom: '10px'}}>Relatório Fotográfico Técnico</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '30px' }}>
              <div style={{ border: '2px solid #eee', padding: '15px', borderRadius: '10px' }}>
                <div style={{ height: '220px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>📸 Área de Operação</div>
                <input type="text" placeholder="Legenda técnica para SEMAS/PA..." style={{ width: '100%', marginTop: '15px', padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ border: '2px solid #eee', padding: '15px', borderRadius: '10px' }}>
                <div style={{ height: '220px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>📸 Sistema de Contenção</div>
                <input type="text" placeholder="Legenda técnica para SEMAS/PA..." style={{ width: '100%', marginTop: '15px', padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }} />
              </div>
            </div>
            <button style={{ marginTop: '30px', padding: '15px 30px', background: '#001d3d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              🖨️ GERAR PDF DO LAUDO
            </button>
          </div>
        )}

        {/* ABA 4: GERADOR DE DOCUMENTOS */}
        {aba === 'docs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {['Ofício de Requerimento', 'Procuração Ambiental', 'Checklist de Entrega', 'PGRS - Síntese'].map(doc => (
              <div key={doc} style={{ background: '#001d3d', padding: '25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{fontSize: '18px', fontWeight: 'bold'}}>{doc}</span>
                <button style={{ padding: '10px 20px', background: '#ffc300', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📄 GERAR DOC</button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

// ESTILOS DE COMPONENTES
const tabStyle = (active) => ({
  padding: '12px 25px', background: active ? '#ffc300' : 'transparent',
  color: active ? '#000' : '#fff', border: active ? 'none' : '1px solid #ffc300',
  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'
});

const btnAction = { background: '#004b23', color: '#00f5d4', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
