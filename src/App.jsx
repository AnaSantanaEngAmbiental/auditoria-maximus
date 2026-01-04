import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV18() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setFrota(veiculos || []);
  }

  const extrairDados = (nome) => {
    const textoSuperior = nome.toUpperCase();
    const placaMatch = textoSuperior.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placaIdentificada = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const dataValidade = dataMatch ? dataMatch[0] : "31/12/2026";

    return {
      placa: placaIdentificada,
      validade: dataValidade,
      tipoCiv: textoSuperior.includes("CIV") || textoSuperior.includes("CRLV") || textoSuperior.includes("3.1"),
      tipoCipp: textoSuperior.includes("CIPP") || textoSuperior.includes("CTPP") || textoSuperior.includes("5.2")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairDados(file.name);
      const path = `docs/${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (uploadErr) continue;

      const { data: urlPublica } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: urlPublica.publicUrl,
        placa_relacionada: info.placa 
      }]);

      if (info.placa) {
        const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
        
        const dadosNovos = {
          placa: info.placa,
          motorista: existente?.motorista || "AUDITADO",
          validade_civ: info.tipoCiv ? info.validade : (existente?.validade_civ || "PENDENTE"),
          validade_cipp: info.tipoCipp ? info.validade : (existente?.validade_cipp || "PENDENTE"),
          url_doc_referencia: urlPublica.publicUrl
        };

        if (existente) {
          await supabase.from('frota_veiculos').update(dadosNovos).eq('id', existente.id);
        } else {
          await supabase.from('frota_veiculos').insert([dadosNovos]);
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarAuditoria = async () => {
    if (!confirm("Deseja limpar todos os dados e corrigir as duplicidades?")) return;
    setLoading(true);
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const v of f) await supabase.from('frota_veiculos').delete().eq('id', v.id);
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const d of a) await supabase.from('arquivos_processo').delete().eq('id', d.id);
    await carregarDados();
    setLoading(false);
    alert("Ambiente Resetado com Sucesso!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#10b981', marginBottom: '40px', fontWeight: '900' }}>MAXIMUS v18</h2>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={18}/> Auditoria de Frota
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18}/> Repositório ({arquivos.length})
          </button>
        </nav>
        <button onClick={resetarAuditoria} style={{ padding: '15px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Trash2 size={16}/> LIMPAR TUDO
        </button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <input placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '12px', width: '300px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <label style={{ padding: '12px 25px', background: '#4f46e5', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18}/> {loading ? "SINCRONIZANDO..." : "CARREGAR ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>VEÍCULO</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {v.url_doc_referencia && (
                          <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={20}/></a>
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
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ marginBottom: '8px', margin: '0 auto' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all', marginBottom: '10px' }}>{a.nome_arquivo}</div>
                  <a href={a.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>VER PDF</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
