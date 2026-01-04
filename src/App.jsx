import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, Trash2, Download, Eye, 
  ShieldCheck, RefreshCw, AlertCircle, HardDrive, 
  Search, List, Database, Layers
} from 'lucide-react';

// Configuração do Engine
const VERSION = "v31.0-MASTER";
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV31() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [dbStatus, setDbStatus] = useState('online');

  useEffect(() => {
    setIsClient(true);
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setArquivos(docs || []);
      setFrota(veiculos || []);
      setDbStatus('online');
    } catch (error) {
      setDbStatus('offline');
      console.error("Erro de sincronização:", error);
    }
  };

  const motorDeCaptura = (nome) => {
    const limpo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mercosul = limpo.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/);
    const antigo = limpo.match(/[A-Z]{3}[0-9]{4}/);
    const placa = mercosul ? mercosul[0] : (antigo ? antigo[0] : null);

    const isCiv = /CIV|CRLV|31|INSPECAO/.test(limpo);
    const isCipp = /CIPP|CTPP|52|PERIGOSOS/.test(limpo);

    return { placa, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = motorDeCaptura(file.name);
      if (!info.placa) continue;

      const path = `enterprise/${VERSION}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (upErr) continue;

      const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, url_publica: urlData.publicUrl, placa_relacionada: info.placa 
      }]);

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      
      const dados = {
        placa: info.placa,
        motorista: "AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: urlData.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(dados).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([dados]); }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if (!confirm("Deseja apagar todos os dados desta versão?")) return;
    setLoading(true);
    await supabase.from('frota_veiculos').delete().neq('id', 0);
    await supabase.from('arquivos_processo').delete().neq('id', 0);
    await carregarDados();
    setLoading(false);
  };

  if (!isClient) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER ESTATICO COM VERSÃO */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#0f172a', color: 'white', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="#10b981" size={28} />
          <div>
            <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold' }}>MAXIMUS AUDIT</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>{VERSION}</span>
              <span style={{ fontSize: '10px', color: dbStatus === 'online' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={10} /> {dbStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={resetTotal} style={{ background: 'transparent', color: '#f87171', border: '1px solid #450a0a', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            LIMPAR DADOS
          </button>
          <label style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Download size={16} />}
            {loading ? "SINCRONIZANDO..." : "IMPORTAR PDFS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </header>

      <main style={{ padding: '30px' }}>
        {/* RESUMO DE FROTA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <StatBox label="Veículos na Base" value={frota.length} color="#4f46e5" />
          <StatBox label="Documentos Processados" value={arquivos.length} color="#64748b" />
          <StatBox label="Pendências Críticas" value={frota.filter(v => v.validade_civ === 'PENDENTE' || v.validade_cipp === 'PENDENTE').length} color="#ef4444" />
        </div>

        {/* ÁREA DE TRABALHO */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfcfd' }}>
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
              <TabBtn active={abaAtiva === 'frota'} onClick={() => setAbaAtiva('frota')} icon={<List size={16}/>} label="VISTA DA FROTA" />
              <TabBtn active={abaAtiva === 'docs'} onClick={() => setAbaAtiva('docs')} icon={<Layers size={16}/>} label="LOG DE ARQUIVOS" />
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Filtrar por placa..." 
                value={filtro}
                onChange={(e) => setFiltro(e.target.value.toUpperCase())}
                style={{ padding: '8px 12px 8px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {abaAtiva === 'frota' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thStyle}>Placa</th>
                    <th style={thStyle}>CIV (Amb.)</th>
                    <th style={thStyle}>CIPP (Amb.)</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {frota.filter(v => v.placa.includes(filtro)).map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold', letterSpacing: '1px' }}>{v.placa}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <StatusBadge val={v.validade_civ} />
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <StatusBadge val={v.validade_cipp} />
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                        <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', display: 'inline-flex', padding: '6px', borderRadius: '6px', backgroundColor: '#eef2ff' }}>
                          <Eye size={18} />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {frota.length === 0 && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum dado capturado nesta versão.</td></tr>}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', padding: '25px' }}>
                {arquivos.map(a => (
                  <div key={a.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', position: 'relative' }}>
                    <FileText color="#94a3b8" size={24} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '8px 0', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                    <div style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 'bold' }}>PLACA DETECTADA: {a.placa_relacionada}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Sub-componentes
const StatBox = ({ label, value, color }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderBottom: `4px solid ${color}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>{value}</div>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? '#0f172a' : '#64748b', fontWeight: 'bold', fontSize: '12px', transition: '0.2s' }}>
    {icon} {label}
  </button>
);

const StatusBadge = ({ val }) => {
  const isErr = val === 'PENDENTE';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: isErr ? '#fff1f2' : '#f0fdf4', color: isErr ? '#e11d48' : '#16a34a' }}>
      {isErr ? <AlertCircle size={12}/> : <CheckCircle size={12}/>} {val}
    </span>
  );
};

const thStyle = { padding: '12px 20px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
