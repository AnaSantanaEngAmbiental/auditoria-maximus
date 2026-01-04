import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, FileText, AlertTriangle, Trash2, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV15() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      setArquivos(docs || []);
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(veiculos || []);
    } catch (e) { console.error("Erro ao carregar:", e); }
  }

  const extrairInfo = (nomeArquivo) => {
    const texto = nomeArquivo.toUpperCase();
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    const dataMatch = nomeArquivo.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const dataRef = dataMatch ? dataMatch[0] : "31/12/2026";

    return {
      placa,
      dataRef,
      isCiv: texto.includes("CIV") || texto.includes("CRLV") || texto.includes("3.1"),
      isCipp: texto.includes("CIPP") || texto.includes("CTPP") || texto.includes("5.1") || texto.includes("5.2")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairInfo(file.name);
      const filePath = `auditoria/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from('processos-ambientais').upload(filePath, file);
      if (uploadError) continue;

      const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(filePath);
      await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: urlData.publicUrl }]);

      if (info.placa) {
        // LÓGICA ANTI-DUPLICIDADE (UPSERT)
        const { data: exist } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
        
        const updateData = {
          placa: info.placa,
          motorista: exist?.motorista || "IDENTIFICADO VIA DOC",
          validade_civ: info.isCiv ? info.dataRef : (exist?.validade_civ || "PENDENTE"),
          validade_cipp: info.isCipp ? info.dataRef : (exist?.validade_cipp || "PENDENTE")
        };

        if (exist) {
          await supabase.from('frota_veiculos').update(updateData).eq('id', exist.id);
        } else {
          await supabase.from('frota_veiculos').insert([updateData]);
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if (!confirm("Atenção: Isso limpará todos os dados para uma nova auditoria. Continuar?")) return;
    setLoading(true);
    
    // Limpeza por ID (Evita Erro 400 de permissão de massa)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const item of f) await supabase.from('frota_veiculos').delete().eq('id', item.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const item of a) await supabase.from('arquivos_processo').delete().eq('id', item.id);

    await carregarDados();
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px' }}>
        <h1 style={{ color: '#10b981', fontWeight: '900', marginBottom: '40px' }}>MAXIMUS v15.0</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ background: abaAtiva === 'frota' ? '#1e293b' : 'none', color: 'white', border: 'none', padding: '15px', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🚚 Gestão de Frota</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ background: abaAtiva === 'docs' ? '#1e293b' : 'none', color: 'white', border: 'none', padding: '15px', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>📂 Documentos ({arquivos.length})</button>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '100px' }}>
          <button onClick={resetTotal} style={{ width: '100%', padding: '12px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>RESETAR AUDITORIA</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <input placeholder="🔍 Filtrar por placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '12px', width: '300px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <label style={{ background: '#4f46e5', color: 'white', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? "SINCRONIZANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>VEÍCULO / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>SITUAÇÃO CIV</th>
                  <th style={{ padding: '15px' }}>SITUAÇÃO CIPP</th>
                  <th style={{ padding: '15px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" size={20} /> : <AlertTriangle color="#f59e0b" size={20} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}>
                  <FileText size={30} color="#6366f1" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '10px', wordBreak: 'break-all', fontWeight: '500' }}>{a.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
