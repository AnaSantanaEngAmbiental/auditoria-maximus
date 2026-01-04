import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV23() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [montado, setMontado] = useState(false); // Proteção contra Erro 418

  useEffect(() => {
    setMontado(true);
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      setArquivos(docs || []);
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(veiculos || []);
    } catch (err) { console.error("Erro ao carregar:", err); }
  }

  const processarDocumento = (nome) => {
    const n = nome.toUpperCase();
    const placaMatch = n.replace(/[^A-Z0-9]/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validade = dataMatch ? dataMatch[0] : "31/12/2026";

    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("3.1");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("5.2");

    return { placa, validade, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = processarDocumento(file.name);
      if (!info.placa) continue;

      const path = `v23/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl }]);

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      
      const dados = {
        placa: info.placa,
        motorista: ex?.motorista || "MOTORISTA AUDITADO",
        validade_civ: info.isCiv ? info.validade : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? info.validade : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (ex) {
        await supabase.from('frota_veiculos').update(dados).eq('id', ex.id);
      } else {
        await supabase.from('frota_veiculos').insert([dados]);
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarBanco = async () => {
    if (!confirm("Isso apagará todas as duplicidades. Ok?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
  };

  if (!montado) return null; // Evita erro de Hidratação (React Error 418)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '25px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <ShieldCheck color="#10b981" />
          <h2 style={{ fontSize: '18px' }}>MAXIMUS v23</h2>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left' }}>🚚 Frota Auditoria</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left' }}>📂 Arquivos Brutos</button>
        </nav>
        <button onClick={resetarBanco} style={{ padding: '12px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>LIMPAR TUDO</button>
      </aside>

      {/* CONTEÚDO */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '40px' }}>
        {/* DASHBOARD RÁPIDO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>FROTA</p>
            <h3 style={{ margin: 0 }}>{frota.length}</h3>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>OK</p>
            <h3 style={{ margin: 0, color: '#10b981' }}>{frota.filter(v => v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE').length}</h3>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>PENDENTE</p>
            <h3 style={{ margin: 0, color: '#ef4444' }}>{frota.length - frota.filter(v => v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE').length}</h3>
          </div>
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '10px', width: '250px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <label style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? "SINCRONIZANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '12px' }}>VEÍCULO</th>
                  <th style={{ padding: '12px' }}>CIV</th>
                  <th style={{ padding: '12px' }}>CIPP</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{v.placa}</td>
                    <td style={{ padding: '12px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '12px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {v.url_doc_referencia && <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={18}/></a>}
                        {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" size={18}/> : <AlertTriangle color="#f59e0b" size={18}/>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center', background: '#f8fafc' }}>
                  <FileText size={20} color="#6366f1" style={{ margin: '0 auto 5px' }} />
                  <div style={{ fontSize: '10px', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
