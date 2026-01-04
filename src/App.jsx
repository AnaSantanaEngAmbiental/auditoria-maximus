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
    const { data: docs } = await supabase.from('arquivos_processo').select('*');
    setArquivos(docs || []);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    setFrota(veiculos || []);
  }

  const extrairDados = (nomeArquivo) => {
    const texto = nomeArquivo.toUpperCase();
    // Identifica Placa
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Identifica Data de Validade no nome do arquivo (ex: 25-12-2026)
    const dataMatch = nomeArquivo.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validade = dataMatch ? dataMatch[0] : "31/12/2026"; 

    return {
      placa,
      validade,
      tipo: (texto.includes("CIV") || texto.includes("CRLV")) ? 'CIV' : (texto.includes("CIPP") || texto.includes("CTPP")) ? 'CIPP' : 'OUTRO'
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const info = extrairDados(file.name);
      const path = `docs/${Date.now()}_${file.name}`;

      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!storageError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl }]);

        if (info.placa) {
          const { data: existente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).single();
          
          let updateData = {
            placa: info.placa,
            motorista: "IDENTIFICADO",
            validade_civ: info.tipo === 'CIV' ? info.validade : (existente?.validade_civ || "PENDENTE"),
            validade_cipp: info.tipo === 'CIPP' ? info.validade : (existente?.validade_cipp || "PENDENTE")
          };

          if (existente) {
            await supabase.from('frota_veiculos').update(updateData).eq('placa', info.placa);
          } else {
            await supabase.from('frota_veiculos').insert([updateData]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarForçado = async () => {
    if(!confirm("Deseja apagar tudo? (Isso resolverá a duplicidade)")) return;
    setLoading(true);
    
    // Reset via deleção individual (Ignora Erro 400 de lote)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if(f) for(const item of f) await supabase.from('frota_veiculos').delete().eq('id', item.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if(a) for(const item of a) await supabase.from('arquivos_processo').delete().eq('id', item.id);

    await carregarDados();
    setLoading(false);
    alert("Sistema Resetado e pronto para nova carga!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '25px' }}>
        <h2 style={{ color: '#10b981', marginBottom: '30px' }}>MAXIMUS v13</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: abaAtiva==='frota'?'#334155':'transparent', color: 'white', textAlign: 'left' }}>🚚 Gestão de Frota</button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: abaAtiva==='docs'?'#334155':'transparent', color: 'white', textAlign: 'left' }}>📂 Arquivos ({arquivos.length})</button>
        </div>
        <button onClick={resetarForçado} style={{ marginTop: '50px', width: '100%', padding: '12px', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Trash2 size={16} /> RESETAR AMBIENTE
        </button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? "CARREGANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>PLACA</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>VALIDADE CIV</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>VALIDADE CIPP</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.placa}</td>
                    <td style={{ padding: '15px', color: v.validade_civ==='PENDENTE'?'#ef4444':'#059669' }}>{v.validade_civ}</td>
                    <td style={{ padding: '15px', color: v.validade_cipp==='PENDENTE'?'#ef4444':'#059669' }}>{v.validade_cipp}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <FileText size={24} color="#6366f1" />
                  <p style={{ fontSize: '10px', wordBreak: 'break-all' }}>{a.nome_arquivo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
