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

export default function MaximusV12() {
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

  const extrairInteligencia = (nomeArquivo) => {
    const texto = nomeArquivo.toUpperCase();
    
    // Procura Placa
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Procura Data (ex: 20/12/2026 ou 2026-12-31)
    const dataMatch = nomeArquivo.match(/(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
    const dataValidade = dataMatch ? dataMatch[0] : "31/12/2026"; // Data padrão se não houver no nome

    return {
      placa,
      dataValidade,
      isCiv: texto.includes("CIV") || texto.includes("CRLV") || texto.includes("LAUDO"),
      isCipp: texto.includes("CIPP") || texto.includes("CTPP") || texto.includes("CTP")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
    
    for (const file of files) {
      const info = extrairInteligencia(file.name);
      const path = `auditoria/${Date.now()}_${file.name}`;

      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!storageError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl, status: 'APROVADO' }]);

        if (info.placa) {
          const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).single();
          
          const dadosFrota = {
            placa: info.placa,
            motorista: existente?.motorista || "IDENTIFICADO POR DOC",
            validade_civ: info.isCiv ? info.dataValidade : (existente?.validade_civ || "PENDENTE"),
            validade_cipp: info.isCipp ? info.dataValidade : (existente?.validade_cipp || "PENDENTE")
          };

          if (existente) {
            await supabase.from('frota_veiculos').update(dadosFrota).eq('placa', info.placa);
          } else {
            await supabase.from('frota_veiculos').insert([dadosFrota]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const gerarRelatorioPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MAXIMUS AI - RELATÓRIO DE AUDITORIA", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

    const colunas = ["Placa", "Motorista", "CIV / CRLV", "CIPP / CTPP", "Status"];
    const linhas = frota.map(v => [
      v.placa, 
      v.motorista, 
      v.validade_civ, 
      v.validade_cipp,
      (v.validade_civ !== "PENDENTE" && v.validade_cipp !== "PENDENTE") ? "CONFORME" : "PENDENTE"
    ]);
    
    doc.autoTable({
      head: [colunas],
      body: linhas,
      startY: 35,
      headStyles: { fillColor: [16, 185, 129] },
      theme: 'striped'
    });
    doc.save(`Auditoria_Frota_Maximus_${Date.now()}.pdf`);
  };

  const resetarAmbienteTotal = async () => {
    if(!confirm("AVISO CRÍTICO: Isto apagará DEFINITIVAMENTE todos os dados de todas as tabelas. Deseja continuar?")) return;
    setLoading(true);
    
    try {
      // 1. Apaga Documentos um por um (Evita erro 400 RLS)
      const { data: d } = await supabase.from('arquivos_processo').select('id');
      if(d) for(const doc of d) await supabase.from('arquivos_processo').delete().eq('id', doc.id);

      // 2. Apaga Frota um por um
      const { data: f } = await supabase.from('frota_veiculos').select('id');
      if(f) for(const veic of f) await supabase.from('frota_veiculos').delete().eq('id', veic.id);

      setFrota([]);
      setArquivos([]);
      alert("Ambiente totalmente limpo!");
    } catch (e) {
      alert("Erro ao resetar. Tente novamente.");
    } finally {
      setLoading(false);
      carregarDados();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginBottom: '40px' }}>MAXIMUS v12</h1>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#334155' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <Truck size={18} /> GESTÃO DE FROTA
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'docs' ? '#334155' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <LayoutGrid size={18} /> ARQUIVOS ({arquivos.length})
          </button>
        </nav>

        <button onClick={resetarAmbienteTotal} style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', border: 'none', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Trash2 size={16} /> LIMPAR TUDO
        </button>
      </aside>

      {/* CONTEUDO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
            <input type="text" placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '300px' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={gerarRelatorioPDF} style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18}/> PDF
            </button>
            <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18}/> {loading ? "A PROCESSAR..." : "ALIMENTAR"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px' }}>Veículo / Motorista</th>
                  <th style={{ padding: '15px' }}>Validade CIV</th>
                  <th style={{ padding: '15px' }}>Validade CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_civ !== "PENDENTE" ? '#059669' : '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>
                         {v.validade_civ}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_cipp !== "PENDENTE" ? '#059669' : '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>
                         {v.validade_cipp}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {v.validade_civ !== "PENDENTE" && v.validade_cipp !== "PENDENTE" ? <CheckCircle color="#10b981" size={24}/> : <AlertTriangle color="#f59e0b" size={24}/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px', textAlign: 'center', background: '#f8fafc' }}>
                  <FileText size={30} color="#6366f1" style={{ marginBottom: '10px' }}/>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{arq.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
