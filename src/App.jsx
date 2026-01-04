import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, Trash2, Truck, 
  LayoutGrid, FileText, AlertTriangle, User, Calendar
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV10() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    if (veiculos) setFrota(veiculos);
  }

  // REFINO: Extrai placa, tipo de doc e tenta achar o motorista no nome
  const extrairInteligencia = (nomeArquivo) => {
    const texto = nomeArquivo.toUpperCase();
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Busca nome após palavras chave como "MOTORISTA" ou "CONDUTOR"
    const motoristaMatch = texto.match(/(?:MOTORISTA|CONDUTOR)_([A-Z_]+)/);
    const motorista = motoristaMatch ? motoristaMatch[1].replace(/_/g, ' ') : "EXTRAÍDO VIA DOC";

    return {
      placa,
      motorista,
      isCiv: texto.includes("CIV"),
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
            motorista: info.motorista !== "EXTRAÍDO VIA DOC" ? info.motorista : (existente?.motorista || "IDENTIFICANDO..."),
            validade_civ: info.isCiv ? "2026-12-31" : (existente?.validade_civ || null),
            validade_cipp: info.isCipp ? "2026-12-31" : (existente?.validade_cipp || null)
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>MAXIMUS AI</h1>
        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '40px' }}>AUDITORIA INTELIGENTE v10.0</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <Truck size={20} /> GESTÃO DE FROTA
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <LayoutGrid size={20} /> ARQUIVOS ({arquivos.length})
          </button>
        </nav>

        <button onClick={async () => { if(confirm("Resetar?")) { await supabase.from('arquivos_processo').delete().neq('id', '0'); await supabase.from('frota_veiculos').delete().neq('id', '0'); carregarDados(); } }} style={{ marginTop: 'auto', padding: '15px', borderRadius: '12px', border: '1px solid #334155', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>
          <Trash2 size={16} /> RESETAR AMBIENTE
        </button>
      </aside>

      {/* CONTEUDO */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} size={18} />
            <input type="text" placeholder="Filtrar placa ou motorista..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '350px', outline: 'none' }} />
          </div>
          
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
            <UploadCloud size={20}/> {loading ? "PROCESSANDO..." : "CARREGAR DADOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '15px' }}>Veículo / Motorista</th>
                  <th style={{ padding: '15px' }}>Status CIV</th>
                  <th style={{ padding: '15px' }}>Status CIPP</th>
                  <th style={{ padding: '15px' }}>Auditado</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 15px' }}>
                      <div style={{ fontWeight: '800', fontSize: '17px', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ ? <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>REGULAR</span> : <span style={{ color: '#94a3b8', fontSize: '11px' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_cipp ? <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>REGULAR</span> : <span style={{ color: '#94a3b8', fontSize: '11px' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ && v.validade_cipp ? <CheckCircle color="#10b981" size={24}/> : <AlertTriangle color="#f59e0b" size={24} style={{opacity: 0.5}}/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px', background: '#f8fafc' }}>
                  <FileText size={24} color="#6366f1" style={{ marginBottom: '12px' }}/>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', wordBreak: 'break-all' }}>{arq.nome_arquivo}</div>
                  <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}>Visualizar PDF →</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
