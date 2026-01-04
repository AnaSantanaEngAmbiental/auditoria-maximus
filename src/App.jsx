import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, Trash2, Truck, 
  LayoutGrid, FileText, AlertTriangle, User, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV11() {
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
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    return {
      placa,
      isCiv: texto.includes("CIV") || texto.includes("CRLV"),
      isCipp: texto.includes("CIPP") || texto.includes("CTPP")
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
            motorista: existente?.motorista || "MOTORISTA PADRÃO",
            validade_civ: info.isCiv ? "CONFORME" : (existente?.validade_civ || "PENDENTE"),
            validade_cipp: info.isCipp ? "CONFORME" : (existente?.validade_cipp || "PENDENTE")
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
    doc.text("Relatório de Auditoria de Frota - Maximus AI", 14, 15);
    const colunas = ["Placa", "Motorista", "Status CIV", "Status CIPP"];
    const linhas = frota.map(v => [v.placa, v.motorista, v.validade_civ, v.validade_cipp]);
    
    doc.autoTable({
      head: [colunas],
      body: linhas,
      startY: 25,
      theme: 'grid'
    });
    doc.save(`auditoria_frota_${new Date().toLocaleDateString()}.pdf`);
  };

  const resetarAmbiente = async () => {
    if(!confirm("Deseja apagar todos os dados e começar do zero?")) return;
    setLoading(true);
    
    // Deleta registros um por um para evitar erro 400 de política de segurança
    const { data: v } = await supabase.from('frota_veiculos').select('id');
    if(v) for(const item of v) await supabase.from('frota_veiculos').delete().eq('id', item.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if(a) for(const item of a) await supabase.from('arquivos_processo').delete().eq('id', item.id);

    setFrota([]);
    setArquivos([]);
    setLoading(false);
    alert("Ambiente Resetado com Sucesso!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginBottom: '40px' }}>MAXIMUS v11</h1>
        
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>CONFORMIDADE GERAL</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{frota.filter(v => v.validade_civ === "CONFORME" && v.validade_cipp === "CONFORME").length} / {frota.length}</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#334155' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
            <Truck size={18} /> GESTÃO DE FROTA
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'docs' ? '#334155' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
            <LayoutGrid size={18} /> DOCUMENTOS ({arquivos.length})
          </button>
        </nav>

        <button onClick={resetarAmbiente} style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', border: 'none', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Trash2 size={16} /> RESETAR TUDO
        </button>
      </aside>

      {/* CONTEUDO */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <input type="text" placeholder="Buscar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '300px' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={gerarRelatorioPDF} style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18}/> RELATÓRIO PDF
            </button>
            <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18}/> {loading ? "CARREGANDO..." : "CARREGAR DOCS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                  <th style={{ padding: '15px' }}>VEÍCULO</th>
                  <th style={{ padding: '15px' }}>SITUAÇÃO CIV</th>
                  <th style={{ padding: '15px' }}>SITUAÇÃO CIPP</th>
                  <th style={{ padding: '15px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{v.placa}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_civ === "CONFORME" ? '#059669' : '#94a3b8', fontWeight: 'bold' }}>{v.validade_civ}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_cipp === "CONFORME" ? '#059669' : '#94a3b8', fontWeight: 'bold' }}>{v.validade_cipp}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ === "CONFORME" && v.validade_cipp === "CONFORME" ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <FileText size={30} color="#6366f1" style={{ marginBottom: '10px' }}/>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{arq.nome_arquivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
