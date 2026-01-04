import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, Trash2, Truck, 
  LayoutGrid, FileText, AlertTriangle
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV93() {
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

  // Função corrigida para extrair TUDO do nome do arquivo
  const processarNomeArquivo = (nomeOriginal) => {
    const texto = nomeOriginal.toUpperCase();
    
    // 1. Extrai Placa
    const placaMatch = texto.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // 2. Extrai Motorista (se houver padrão "MOTORISTA_NOME")
    const motoristaMatch = texto.match(/MOTORISTA_([A-Z_]+)/);
    const motorista = motoristaMatch ? motoristaMatch[1].replace(/_/g, ' ') : "EXTRAÍDO VIA DOC";

    return { 
      placa, 
      motorista,
      isCiv: texto.includes("CIV"),
      isCipp: texto.includes("CIPP") || texto.includes("CTPP")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    
    for (const file of files) {
      const info = processarNomeArquivo(file.name);
      const path = `auditoria/${Date.now()}_${file.name}`;

      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!storageError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // Registra o documento
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: file.name, 
          url_publica: url.publicUrl, 
          status: 'APROVADO' 
        }]);

        // Sincroniza a Frota
        if (info.placa) {
          const { data: vExistente } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).single();
          
          const dadosParaSalvar = {
            placa: info.placa,
            motorista: info.motorista !== "EXTRAÍDO VIA DOC" ? info.motorista : (vExistente?.motorista || "IDENTIFICANDO..."),
            validade_civ: info.isCiv ? "2026-12-31" : (vExistente?.validade_civ || null),
            validade_cipp: info.isCipp ? "2026-12-31" : (vExistente?.validade_cipp || null)
          };

          if (vExistente) {
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

  const handleReset = async () => {
    if (confirm("Limpar ambiente para nova empresa?")) {
      setLoading(true);
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('frota_veiculos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setArquivos([]);
      setFrota([]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '25px' }}>
        <h2 style={{ color: '#10b981', margin: '0 0 40px 0' }}>MAXIMUS AI</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '12px', textAlign: 'left', background: abaAtiva === 'frota' ? '#1e293b' : 'none', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={18}/> FROTA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '12px', textAlign: 'left', background: abaAtiva === 'docs' ? '#1e293b' : 'none', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutGrid size={18}/> DOCUMENTOS ({arquivos.length})
          </button>
        </nav>
        <button onClick={handleReset} style={{ marginTop: 'auto', width: '100%', padding: '10px', background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', position: 'absolute', bottom: '25px', left: '0' }}>RESETAR AMBIENTE</button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <input type="text" placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? "PROCESSANDO..." : "CARREGAR ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA / MOTORISTA</th>
                  <th style={{ padding: '15px' }}>CIV</th>
                  <th style={{ padding: '15px' }}>CIPP</th>
                  <th style={{ padding: '15px' }}>PENDÊNCIAS</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>{v.validade_civ ? <b style={{color: '#10b981'}}>OK</b> : <span style={{color: '#cbd5e1'}}>FALTA</span>}</td>
                    <td style={{ padding: '15px' }}>{v.validade_cipp ? <b style={{color: '#10b981'}}>OK</b> : <span style={{color: '#cbd5e1'}}>FALTA</span>}</td>
                    <td style={{ padding: '15px' }}>
                      {!v.validade_civ && <span style={{ color: '#c2410c', fontSize: '10px', marginRight: '5px' }}>CIV</span>}
                      {!v.validade_cipp && <span style={{ color: '#c2410c', fontSize: '10px' }}>CIPP</span>}
                      {v.validade_civ && v.validade_cipp && <CheckCircle color="#10b981" size={18}/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                {arquivos.map(arq => (
                  <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', background: '#fff' }}>
                    <FileText size={20} color="#6366f1" style={{marginBottom: '5px'}}/>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all' }}>{arq.nome_arquivo}</div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
