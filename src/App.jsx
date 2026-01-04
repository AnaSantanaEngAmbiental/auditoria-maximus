import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw, XCircle
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV26() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(veiculos || []);
  }

  const scannerDePlaca = (nome) => {
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Remove tudo que não é letra ou número
    
    // 1. Tenta Padrão Mercosul (Letra-Letra-Letra-Número-Letra-Número-Número) -> ABC1D23
    const mercosul = n.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/);
    
    // 2. Tenta Padrão Antigo (Letra-Letra-Letra-Número-Número-Número-Número) -> ABC1234
    const antigo = n.match(/[A-Z]{3}[0-9]{4}/);

    const placaFinal = mercosul ? mercosul[0] : (antigo ? antigo[0] : null);

    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("31");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("52");
    
    return { placa: placaFinal, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    const novosLogs = [];

    for (const file of files) {
      const info = scannerDePlaca(file.name);
      
      if (!info.placa) {
        novosLogs.push(`❌ Erro: Placa não encontrada no arquivo "${file.name}"`);
        continue;
      }

      const path = `v26/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      // Salva Log
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: url.publicUrl,
        placa_relacionada: info.placa
      }]);

      // Atualiza Frota
      const { data: ex } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      const dados = {
        placa: info.placa,
        motorista: "AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (ex?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (ex?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (ex) { await supabase.from('frota_veiculos').update(dados).eq('id', ex.id); } 
      else { await supabase.from('frota_veiculos').insert([dados]); }
      
      novosLogs.push(`✅ Sucesso: ${info.placa} identificado (${info.isCiv ? 'CIV' : 'CIPP'})`);
    }
    
    setLogs(novosLogs);
    await carregarDados();
    setLoading(false);
  };

  const limparTudo = async () => {
    if (!confirm("Deseja resetar o banco de dados?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
    setLogs(["SISTEMA REINICIADO"]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '25px', position: 'fixed', height: '100vh' }}>
        <h2 style={{ color: '#10b981', marginBottom: '20px' }}>MAXIMUS v26</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>🚚 Frota ({frota.length})</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>📂 Arquivos ({arquivos.length})</button>
        </nav>
        <div style={{ marginTop: '20px', padding: '10px', background: '#1e293b', borderRadius: '8px', fontSize: '10px', overflowY: 'auto', maxHeight: '200px' }}>
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid #334155', marginBottom: '5px' }}>LOG DE PROCESSAMENTO:</p>
            {logs.map((l, i) => <div key={i} style={{ marginBottom: '3px' }}>{l}</div>)}
        </div>
        <button onClick={limparTudo} style={{ marginTop: 'auto', padding: '10px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>RESETAR BANCO</button>
      </aside>

      <main style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard de Auditoria</h1>
          <label style={{ padding: '12px 25px', background: '#4f46e5', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? <RefreshCw className="animate-spin" /> : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>CIV</th>
                  <th style={{ padding: '15px' }}>CIPP</th>
                  <th style={{ padding: '15px' }}>DOC</th>
                </tr>
              </thead>
              <tbody>
                {frota.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum dado capturado. Verifique o Log ao lado.</td></tr>
                ) : (
                    frota.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.placa}</td>
                        <td style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669' }}>{v.validade_civ}</td>
                        <td style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669' }}>{v.validade_cipp}</td>
                        <td><a href={v.url_doc_referencia} target="_blank" rel="noreferrer"><Eye size={20} color="#4f46e5"/></a></td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{a.nome_arquivo}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Placa: {a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
