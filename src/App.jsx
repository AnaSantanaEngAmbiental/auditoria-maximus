import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw,
  LayoutGrid, List
} from 'lucide-react';

// Configuração Supabase
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV20() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Cálculos do Dashboard
  const totalVeiculos = frota.length;
  const conformes = frota.filter(v => v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE').length;
  const pendentes = totalVeiculos - conformes;

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      setArquivos(docs || []);
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(veiculos || []);
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    }
  }

  const extrairDadosIA = (nome) => {
    const n = nome.toUpperCase().replace(/\s/g, '');
    const placaMatch = n.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validade = dataMatch ? dataMatch[0] : "31/12/2026";

    return {
      placa,
      validade,
      isCiv: n.includes("CIV") || n.includes("CRLV") || n.includes("3.1"),
      isCipp: n.includes("CIPP") || n.includes("CTPP") || n.includes("5.2")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairDadosIA(file.name);
      const path = `auditoria_v20/${Date.now()}_${file.name}`;

      const { error: storageErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (storageErr) continue;

      const { data: publicRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: publicRes.publicUrl 
      }]);

      if (info.placa) {
        const { data: exist } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
        
        const payload = {
          placa: info.placa,
          motorista: exist?.motorista || "AUDITADO EM CAMPO",
          validade_civ: info.isCiv ? info.validade : (exist?.validade_civ || "PENDENTE"),
          validade_cipp: info.isCipp ? info.validade : (exist?.validade_cipp || "PENDENTE"),
          url_doc_referencia: publicRes.publicUrl
        };

        if (exist) {
          await supabase.from('frota_veiculos').update(payload).eq('id', exist.id);
        } else {
          await supabase.from('frota_veiculos').insert([payload]);
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if (!confirm("Isso apagará todas as duplicidades. Deseja limpar o banco agora?")) return;
    setLoading(true);
    
    // Deleta um por um para evitar erro de permissão (400)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const row of f) await supabase.from('frota_veiculos').delete().eq('id', row.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const row of a) await supabase.from('arquivos_processo').delete().eq('id', row.id);

    await carregarDados();
    setLoading(false);
    alert("Sistema Limpo!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <ShieldCheck color="#10b981" size={32} />
          <h1 style={{ fontSize: '22px', fontWeight: '900' }}>MAXIMUS v20</h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <List size={20}/> Tabela de Auditoria
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20}/> Arquivos ({arquivos.length})
          </button>
        </nav>

        <button onClick={resetTotal} style={{ padding: '15px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trash2 size={18}/> LIMPAR SISTEMA
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* DASHBOARD CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>FROTA TOTAL</p>
            <h2 style={{ margin: '5px 0 0 0', fontSize: '28px' }}>{totalVeiculos}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>CONFORMES</p>
            <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#10b981' }}>{conformes}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>PENDENTES</p>
            <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#ef4444' }}>{pendentes}</h2>
          </div>
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} size={18} />
            <input placeholder="Buscar placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '15px 15px 15px 45px', width: '350px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
          </div>
          
          <label style={{ padding: '15px 25px', background: '#4f46e5', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loading ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
            {loading ? "PROCESSANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px' }}>Placa</th>
                  <th style={{ padding: '15px' }}>Validade CIV</th>
                  <th style={{ padding: '15px' }}>Validade CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Ver Doc</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', fontSize: '16px' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                        {v.url_doc_referencia && (
                          <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', background: '#eef2ff', padding: '8px', borderRadius: '8px' }}>
                            <Eye size={20}/>
                          </a>
                        )}
                        {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', background: '#f8fafc', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ marginBottom: '10px', margin: '0 auto' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all', marginBottom: '10px' }}>{a.nome_arquivo}</div>
                  <a href={a.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none' }}>ABRIR PDF</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
