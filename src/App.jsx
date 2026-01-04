import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw,
  List, ExternalLink
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV22() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

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
    } catch (err) { console.error(err); }
  }

  const engineExtracaoPro = (nome) => {
    const n = nome.toUpperCase();
    
    // Identifica a placa com mais precisão
    const placaMatch = n.replace(/[^A-Z0-9]/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Procura por datas
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validade = dataMatch ? dataMatch[0] : "31/12/2026";

    // Lógica Flexível de Tipos de Documento
    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("3.1") || n.includes("CERTIFICADO DE INSPECAO");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("5.2") || n.includes("PRODUTOS PERIGOSOS");

    return { placa, validade, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = engineExtracaoPro(file.name);
      if (!info.placa) continue; // Pula se não achar placa no nome

      const path = `auditoria_v22/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (storageErr) continue;

      const { data: publicRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      // Salva log do arquivo
      await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: publicRes.publicUrl }]);

      // UNIFICAÇÃO DE DADOS (UPSERT)
      const { data: exist } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      
      const updatePayload = {
        placa: info.placa,
        motorista: exist?.motorista || "IDENTIFICADO",
        // Só atualiza se o novo arquivo for do tipo correspondente, senão mantém o que já tinha
        validade_civ: info.isCiv ? info.validade : (exist?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? info.validade : (exist?.validade_cipp || "PENDENTE"),
        url_doc_referencia: publicRes.publicUrl
      };

      if (exist) {
        await supabase.from('frota_veiculos').update(updatePayload).eq('id', exist.id);
      } else {
        await supabase.from('frota_veiculos').insert([updatePayload]);
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarSistema = async () => {
    if (!confirm("Isso apagará tudo para limpar as duplicidades. Ok?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const r of f) await supabase.from('frota_veiculos').delete().eq('id', r.id);
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const r of a) await supabase.from('arquivos_processo').delete().eq('id', r.id);
    await carregarDados();
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <ShieldCheck color="#10b981" size={30} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>MAXIMUS v22</h2>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '15px', borderRadius: '10px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>🚚 Frota</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '15px', borderRadius: '10px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>📂 Arquivos</button>
        </nav>
        <button onClick={resetarSistema} style={{ padding: '15px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>RESETAR TUDO</button>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>TOTAL VEÍCULOS</p>
            <h2 style={{ margin: 0 }}>{totalVeiculos}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #10b981' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>CONFORMES</p>
            <h2 style={{ margin: 0, color: '#10b981' }}>{conformes}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #ef4444' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>PENDENTES</p>
            <h2 style={{ margin: 0, color: '#ef4444' }}>{pendentes}</h2>
          </div>
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input placeholder="Filtrar por placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '12px', width: '300px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <label style={{ padding: '12px 25px', background: '#4f46e5', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? "PROCESSANDO..." : "CARREGAR DOCS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>STATUS / DOC</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.placa}</td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        {v.url_doc_referencia && <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={20}/></a>}
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
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{a.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
