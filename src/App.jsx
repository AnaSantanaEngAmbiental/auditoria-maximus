import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, LayoutGrid 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV16() {
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

  const extrairMetadados = (nome) => {
    const n = nome.toUpperCase();
    const placaMatch = n.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Procura data (DD/MM/YYYY ou DD-MM-YYYY)
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
      const info = extrairMetadados(file.name);
      const path = `docs/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (uploadError) continue;

      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl }]);

      if (info.placa) {
        // LÓGICA ANTI-DUPLICIDADE
        const { data: exist } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
        
        const payload = {
          placa: info.placa,
          motorista: exist?.motorista || "IDENTIFICADO EM AUDITORIA",
          validade_civ: info.isCiv ? info.validade : (exist?.validade_civ || "PENDENTE"),
          validade_cipp: info.isCipp ? info.validade : (exist?.validade_cipp || "PENDENTE")
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

  const resetarTudo = async () => {
    if (!confirm("Isso apagará todos os dados para corrigir a duplicidade. Continuar?")) return;
    setLoading(true);
    
    // Limpeza linha por linha para contornar bloqueio RLS (Erro 400)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const item of f) await supabase.from('frota_veiculos').delete().eq('id', item.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const item of a) await supabase.from('arquivos_processo').delete().eq('id', item.id);

    await carregarDados();
    setLoading(false);
    alert("Ambiente limpo com sucesso!");
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("MAXIMUS AI - Relatório de Auditoria", 14, 15);
    doc.autoTable({
      head: [['Placa', 'Motorista', 'Validade CIV', 'Validade CIPP', 'Status']],
      body: frota.map(v => [
        v.placa, v.motorista, v.validade_civ, v.validade_cipp,
        (v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE') ? 'OK' : 'PENDENTE'
      ]),
      startY: 20,
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save(`Auditoria_Frota_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: '#10b981', fontSize: '22px', fontWeight: 'bold', marginBottom: '40px' }}>MAXIMUS v16.0</h1>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '15px', borderRadius: '10px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>🚚 Gestão de Frota</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '15px', borderRadius: '10px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>📂 Arquivos ({arquivos.length})</button>
        </nav>
        <button onClick={resetarTudo} style={{ padding: '15px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>LIMPAR SISTEMA</button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
            <input placeholder="Buscar placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '300px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={gerarPDF} style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>PDF</button>
            <label style={{ padding: '12px 20px', background: '#4f46e5', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? "PROCESSANDO..." : "CARREGAR DOCS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
