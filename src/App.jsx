import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, Trash2, Truck, 
  LayoutGrid, FileText, AlertTriangle, Download, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV14() {
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

  // Extrai Placa, Tipo e Data do nome do arquivo
  const extrairMetadados = (nome) => {
    const n = nome.toUpperCase();
    const placaMatch = n.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Busca data (00/00/0000 ou 00-00-0000)
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
    if (files.length === 0) return;
    setLoading(true);
    
    for (const file of files) {
      const info = extrairMetadados(file.name);
      const path = `docs/${Date.now()}_${file.name}`;

      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!storageError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl }]);

        if (info.placa) {
          // BUSCA SE JÁ EXISTE PARA EVITAR DUPLICIDADE
          const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).single();
          
          const dadosParaSalvar = {
            placa: info.placa,
            motorista: existente?.motorista || "AUDITADO VIA DOC",
            validade_civ: info.isCiv ? info.validade : (existente?.validade_civ || "PENDENTE"),
            validade_cipp: info.isCipp ? info.validade : (existente?.validade_cipp || "PENDENTE")
          };

          if (existente) {
            await supabase.from('frota_veiculos').update(dadosParaSalvar).eq('placa', info.placa);
          } else {
            await supabase.from('frota_veiculos').insert([dadosParaSalvar]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarSistemaTotal = async () => {
    if (!confirm("Isso apagará todos os dados de frota e documentos para limpar a duplicidade. Confirmar?")) return;
    setLoading(true);
    
    // Deleta individualmente para não ser bloqueado pelo servidor (Erro 400)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const v of f) await supabase.from('frota_veiculos').delete().eq('id', v.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const doc of a) await supabase.from('arquivos_processo').delete().eq('id', doc.id);

    setFrota([]);
    setArquivos([]);
    setLoading(false);
    alert("Ambiente limpo com sucesso!");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Auditoria Maximus AI", 14, 15);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 22);

    const corpo = frota.map(v => [
      v.placa, 
      v.motorista, 
      v.validade_civ, 
      v.validade_cipp,
      (v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE') ? 'CONFORME' : 'PENDENTE'
    ]);

    doc.autoTable({
      head: [['Placa', 'Motorista', 'Validade CIV', 'Validade CIPP', 'Status']],
      body: corpo,
      startY: 30,
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save("Relatorio_Auditoria_Frota.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginBottom: '40px' }}>MAXIMUS v14</h1>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '14px', borderRadius: '12px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>🚚 FROTA ATUAL</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '14px', borderRadius: '12px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>📂 ARQUIVOS ({arquivos.length})</button>
        </nav>
        <button onClick={resetarSistemaTotal} style={{ padding: '14px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>LIMPAR AMBIENTE</button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <input placeholder="Buscar veículo..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px', width: '350px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportarPDF} style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>GERAR PDF</button>
            <label style={{ padding: '12px 20px', background: '#4f46e5', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? "PROCESSANDO..." : "CARREGAR DOCS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                  <th style={{ padding: '15px' }}>VEÍCULO / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
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
