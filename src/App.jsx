import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Trash2, Truck, LayoutGrid, Eye, AlertTriangle, UserCheck, FileText
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV80() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);
    
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    if (veiculos) setFrota(veiculos);
  }

  // Inteligência de extração de metadados pelo nome do arquivo
  const analisarArquivo = (nome) => {
    const nomeLimpo = nome.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
    
    // Detecta Placa (Padrão Mercosul e Antigo)
    const placaMatch = nomeLimpo.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;

    // Detecta Tipo de Documento
    let tipo = "Outros";
    if (nomeLimpo.includes("CIV")) tipo = "CIV";
    if (nomeLimpo.includes("CIPP") || nomeLimpo.includes("CTPP")) tipo = "CIPP";
    if (nomeLimpo.includes("CRLV")) tipo = "CRLV";

    return { placa, tipo };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const { placa, tipo } = analisarArquivo(file.name);
      const path = `auditoria/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!uploadError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // 1. Salva no Dossiê
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: file.name, 
          url_publica: url.publicUrl, 
          status: 'Aprovado'
        }]);

        // 2. Alimenta a Frota Dinamicamente
        if (placa) {
          const { data: existe } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).single();
          
          if (!existe) {
            // Cria novo veículo
            await supabase.from('frota_veiculos').insert([{ 
              placa: placa, 
              motorista: 'Extraído via Doc',
              validade_civ: tipo === "CIV" ? '2026-12-31' : null,
              validade_cipp: tipo === "CIPP" ? '2026-12-31' : null
            }]);
          } else {
            // Atualiza data se o documento for específico
            if (tipo === "CIV") await supabase.from('frota_veiculos').update({ validade_civ: '2026-12-31' }).eq('placa', placa);
            if (tipo === "CIPP") await supabase.from('frota_veiculos').update({ validade_cipp: '2026-12-31' }).eq('placa', placa);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const handleResetTotal = async () => {
    if (window.confirm("Deseja limpar todos os dados para uma nova auditoria?")) {
      setLoading(true);
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('frota_veiculos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setArquivos([]);
      setFrota([]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', letterSpacing: '-1px' }}>MAXIMUS AI</h1>
          <p style={{ fontSize: '11px', color: '#64748b' }}>AUDITORIA DINÂMICA v8.0</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <Truck size={18} color={abaAtiva === 'frota' ? '#10b981' : '#64748b'} /> FROTA DETECTADA
            <span style={{ marginLeft: 'auto', backgroundColor: '#334155', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>{frota.length}</span>
          </button>
          <button onClick={() => setAbaAtiva('dossie')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'dossie' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <LayoutGrid size={18} color={abaAtiva === 'dossie' ? '#10b981' : '#64748b'} /> DOCUMENTOS
            <span style={{ marginLeft: 'auto', backgroundColor: '#334155', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>{arquivos.length}</span>
          </button>
        </nav>

        <button onClick={handleResetTotal} style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', border: '1px solid #334155', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trash2 size={16} /> RESETAR AMBIENTE
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} size={18}/>
            <input type="text" placeholder="Filtrar placa ou arquivo..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '400px', fontSize: '14px' }} />
          </div>
          
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}>
            <UploadCloud size={20}/> {loading ? "ANALISANDO..." : "ALIMENTAR SISTEMA"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '15px' }}>Placa</th>
                  <th style={{ padding: '15px' }}>Situação CIV</th>
                  <th style={{ padding: '15px' }}>Situação CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '20px', fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>{v.placa}</td>
                    <td style={{ padding: '20px' }}>
                      {v.validade_civ ? <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>CONFORME</span> : <span style={{ color: '#cbd5e1', fontSize: '12px' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '20px' }}>
                      {v.validade_cipp ? <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>CONFORME</span> : <span style={{ color: '#cbd5e1', fontSize: '12px' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      {v.validade_civ && v.validade_cipp ? <CheckCircle color="#10b981" size={24}/> : <AlertTriangle color="#f59e0b" size={24}/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={24} color="#6366f1"/>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{arq.nome_arquivo}</span>
                  </div>
                  <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={14}/> VISUALIZAR EVIDÊNCIA
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {frota.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <UploadCloud size={50} color="#cbd5e1" style={{ marginBottom: '20px' }}/>
              <h3 style={{ color: '#64748b' }}>Aguardando Arraste e Cole</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Alimente o Maximus com PDFs para gerar a frota automaticamente.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
