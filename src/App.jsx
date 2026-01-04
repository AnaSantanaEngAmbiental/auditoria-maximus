import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw, Info
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV25() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => { setMontado(true); carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(veiculos || []);
  }

  const extrairPlacaEData = (nome) => {
    const n = nome.toUpperCase().replace(/\s/g, '');
    
    // REGEX ATUALIZADA: Pega ABC1234 (Antiga) e ABC1A23 (Mercosul)
    // Busca 3 letras + 1 número + 1 letra/número + 2 números
    const placaMatch = n.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    let placa = placaMatch ? placaMatch[0] : null;

    // Formata com hífen apenas para estética se for padrão antigo
    if (placa && !isNaN(placa.charAt(4))) {
        placa = placa.replace(/^([A-Z]{3})([0-9]{4})$/, "$1-$2");
    }

    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("3.1");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("5.2");
    
    return { placa, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairPlacaEData(file.name);
      const path = `v25/${Date.now()}_${file.name}`;
      
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: url.publicUrl,
        placa_relacionada: info.placa || "NÃO IDENTIFICADA"
      }]);

      if (info.placa) {
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
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarTotal = async () => {
    if (!confirm("Isso apagará tudo para começar do zero. Confirmar?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const r of a) await supabase.from('arquivos_processo').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
  };

  if (!montado) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '25px', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#10b981', marginBottom: '30px' }}>MAXIMUS v25</h2>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}>🚚 Frota ({frota.length})</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}>📂 Arquivos ({arquivos.length})</button>
        </nav>
        <button onClick={resetarTotal} style={{ padding: '10px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>RESETAR TUDO</button>
      </aside>

      <main style={{ marginLeft: '260px', flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Auditoria Maximus</h1>
          <label style={{ padding: '12px 25px', background: '#4f46e5', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}>
            {loading ? <RefreshCw className="animate-spin" /> : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>STATUS CIV</th>
                  <th style={{ padding: '15px' }}>STATUS CIPP</th>
                  <th style={{ padding: '15px' }}>VER</th>
                </tr>
              </thead>
              <tbody>
                {frota.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Nenhum veículo identificado ainda.</td></tr>
                ) : (
                    frota.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>{v.placa}</td>
                        <td style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                        <td style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                        <td><a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={20}/></a></td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                  <div style={{ fontSize: '10px', color: a.placa_relacionada === 'NÃO IDENTIFICADA' ? '#ef4444' : '#10b981', marginTop: '5px' }}>{a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
