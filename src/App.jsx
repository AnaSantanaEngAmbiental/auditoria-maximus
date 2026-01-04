import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, Trash2, Download, Eye, 
  ShieldCheck, RefreshCw, AlertCircle, HardDrive, 
  Search, List, Database, Layers, Info
} from 'lucide-react';

// IDENTIFICADOR DE VERSÃO - VEJA ISSO NO TOPO DA TELA
const VERSION_ID = "32.0-ULTRA (FINAL)";

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV32() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setArquivos(docs || []);
    setFrota(veiculos || []);
  }

  const extrairTudo = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = n.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/) || n.match(/[A-Z]{3}[0-9]{4}/);
    const p = m ? m[0] : null;
    const civ = /CIV|CRLV|31|INSPECAO/.test(n);
    const cipp = /CIPP|CTPP|52|PERIGOSOS/.test(n);
    return { p, civ, cipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairTudo(file.name);
      if (!info.p) continue;

      const path = `v32/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, url_publica: url.publicUrl, placa_relacionada: info.p 
      }]);

      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.p).maybeSingle();
      const payload = {
        placa: info.p,
        motorista: "AUDITADO",
        validade_civ: info.civ ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.cipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(payload).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([payload]); }
    }
    await carregarDados();
    setLoading(false);
  };

  if (!montado) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' }}>
      
      {/* BANNER DE VERSÃO E CONTROLE - AGORA EM DESTAQUE TOTAL */}
      <div style={{ backgroundColor: '#001a33', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #10b981' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>MAXIMUS SYSTEM</h1>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
            <span style={{ backgroundColor: '#10b981', color: 'black', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              BUILD: {VERSION_ID}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database size={14}/> DATABASE: CONNECTED
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => { if(confirm("Limpar tudo?")) supabase.from('frota_veiculos').delete().neq('id', 0).then(() => carregarDados()) }} style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            RESETAR
          </button>
          
          <label style={{ backgroundColor: '#10b981', color: 'black', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loading ? <RefreshCw className="spin" /> : <Download size={20} />}
            {loading ? "PROCESSANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </div>

      <main style={{ padding: '30px' }}>
        
        {/* NAVEGAÇÃO INTERNA */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '12px', background: abaAtiva === 'frota' ? '#10b981' : 'white', color: abaAtiva === 'frota' ? 'black' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            🚚 FROTA ATIVA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '12px', background: abaAtiva === 'docs' ? '#10b981' : 'white', color: abaAtiva === 'docs' ? 'black' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            📂 ARQUIVOS BRUTOS ({arquivos.length})
          </button>
        </div>

        {/* BUSCA */}
        <div style={{ marginBottom: '25px' }}>
           <input 
              type="text" 
              placeholder="🔍 Digite a placa para filtrar..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value.toUpperCase())}
              style={{ width: '100%', padding: '15px 20px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
           />
        </div>

        {/* LISTAGEM */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '3px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>CIV (3.1)</th>
                  <th style={{ padding: '15px' }}>CIPP (5.2)</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>VER</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(v => v.placa.includes(filtro)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '20px' }}>{v.placa}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_civ}</span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_cipp}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#001a33' }}><Eye size={28} /></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '15px', textAlign: 'center' }}>
                  <FileText size={30} color="#64748b" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>{a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`.spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
