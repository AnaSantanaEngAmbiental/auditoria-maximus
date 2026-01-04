import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, Trash2, Truck, 
  LayoutGrid, FileText, AlertTriangle, Download, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV13() {
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

  const analisarArquivo = (nome) => {
    const n = nome.toUpperCase();
    const placaMatch = n.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Busca datas no formato DD-MM-YYYY ou DD/MM/YYYY
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validade = dataMatch ? dataMatch[0] : "31/12/2026";

    return {
      placa,
      validade,
      isCiv: n.includes("CIV") || n.includes("CRLV"),
      isCipp: n.includes("CIPP") || n.includes("CTPP")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const info = analisarArquivo(file.name);
      const path = `auditoria/${Date.now()}_${file.name}`;

      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!storageError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl }]);

        if (info.placa) {
          // Busca se o veículo já existe para evitar duplicidade
          const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).single();
          
          const dados = {
            placa: info.placa,
            motorista: existente?.motorista || "MOTORISTA AUDITADO",
            validade_civ: info.isCiv ? info.validade : (existente?.validade_civ || "PENDENTE"),
            validade_cipp: info.isCipp ? info.validade : (existente?.validade_cipp || "PENDENTE")
          };

          if (existente) {
            await supabase.from('frota_veiculos').update(dados).eq('placa', info.placa);
          } else {
            await supabase.from('frota_veiculos').insert([dados]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarSistema = async () => {
    if (!confirm("Isso apagará todos os dados para uma nova auditoria. Confirmar?")) return;
    setLoading(true);
    
    // Deleta individualmente para contornar Erro 400 do servidor
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const v of f) await supabase.from('frota_veiculos').delete().eq('id', v.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const doc of a) await supabase.from('arquivos_processo').delete().eq('id', doc.id);

    setFrota([]);
    setArquivos([]);
    setLoading(false);
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Frota - Maximus AI", 14, 15);
    doc.autoTable({
      head: [['Placa', 'Motorista', 'Validade CIV', 'Validade CIPP']],
      body: frota.map(v => [v.placa, v.motorista, v.validade_civ, v.validade_cipp]),
      startY: 20
    });
    doc.save("Relatorio_Frota.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#10b981', marginBottom: '40px' }}>MAXIMUS v13</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', textAlign: 'left', background: abaAtiva === 'frota' ? '#1e293b' : 'none', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚚 Gestão de Frota</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', textAlign: 'left', background: abaAtiva === 'docs' ? '#1e293b' : 'none', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📂 Documentos ({arquivos.length})</button>
        </nav>
        <button onClick={resetarSistema} style={{ padding: '12px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>LIMPAR AMBIENTE</button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
          <input placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={gerarPDF} style={{ padding: '10px 20px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>GERAR PDF</button>
            <label style={{ padding: '10px 20px', borderRadius: '8px', background: '#4f46e5', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? "CARREGANDO..." : "CARREGAR DOCS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px', color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', background: '#fff' }}>
                  <FileText size={20} color="#6366f1" />
                  <p style={{ fontSize: '10px', marginTop: '5px', wordBreak: 'break-all' }}>{a.nome_arquivo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
