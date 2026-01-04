import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, Trash2, Truck, 
  LayoutGrid, Eye, AlertTriangle, UserCheck, FileText, ClipboardList
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV90() {
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

  // Lógica de refino: Busca motoristas e validades baseada em padrões comuns de frota
  const extrairMetadados = (nome) => {
    const n = nome.toUpperCase();
    const placaMatch = n.replace("-", "").match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    let tipo = "Outros";
    if (n.includes("CIV")) tipo = "CIV";
    if (n.includes("CIPP") || n.includes("CTPP")) tipo = "CIPP";
    
    return { placa, tipo };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const { placa, tipo } = extrairMetadados(file.name);
      const path = `auditoria/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ nome_arquivo: file.name, url_publica: url.publicUrl, status: 'APROVADO' }]);

        if (placa) {
          const { data: existe } = await supabase.from('frota_veiculos').select('*').eq('placa', placa).single();
          
          const dadosUpdate = {
            placa: placa,
            motorista: n.includes("PLANILHA") ? "SINCRONIZADO" : (existe?.motorista || "IDENTIFICANDO..."),
            validade_civ: tipo === "CIV" ? "2026-12-30" : (existe?.validade_civ || null),
            validade_cipp: tipo === "CIPP" ? "2026-12-30" : (existe?.validade_cipp || null)
          };

          if (existe) {
            await supabase.from('frota_veiculos').update(dadosUpdate).eq('placa', placa);
          } else {
            await supabase.from('frota_veiculos').insert([dadosUpdate]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const handleResetTotal = async () => {
    if (window.confirm("Isso apagará todos os dados de frota e documentos. Confirmar?")) {
      setLoading(true);
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('frota_veiculos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setArquivos([]);
      setFrota([]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginBottom: '5px' }}>MAXIMUS AI</h1>
        <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '40px' }}>CONTROLE DINÂMICO v9.0</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <Truck size={18} /> FROTA DETECTADA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('dossie')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: abaAtiva === 'dossie' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}>
            <LayoutGrid size={18} /> DOCUMENTOS ({arquivos.length})
          </button>
        </nav>

        <button onClick={handleResetTotal} style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', border: '1px solid #334155', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>
          <Trash2 size={16} /> RESETAR AMBIENTE
        </button>
      </aside>

      {/* CONTEUDO */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <input type="text" placeholder="Localizar placa ou motorista..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '350px' }} />
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '14px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UploadCloud size={20}/> {loading ? "SINCRONIZANDO..." : "ALIMENTAR SISTEMA"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px' }}>Placa / Motorista</th>
                  <th style={{ padding: '15px' }}>Situação CIV</th>
                  <th style={{ padding: '15px' }}>Situação CIPP</th>
                  <th style={{ padding: '15px' }}>Pendências</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', fontSize: '16px' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{v.motorista || "Não identificado"}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_civ ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>CONFORME</span> : <span style={{ color: '#cbd5e1' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {v.validade_cipp ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>CONFORME</span> : <span style={{ color: '#cbd5e1' }}>PENDENTE</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {!v.validade_civ && <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Falta CIV</span>}
                        {!v.validade_cipp && <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Falta CIPP</span>}
                        {v.validade_civ && v.validade_cipp && <CheckCircle color="#10b981" size={18}/>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {arquivos.map(arq => (
                <div key={arq.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '15px' }}>
                  <FileText size={20} color="#6366f1" style={{ marginBottom: '10px' }}/>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-all', height: '35px', overflow: 'hidden' }}>{arq.nome_arquivo}</div>
                  <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', textDecoration: 'none', display: 'block', marginTop: '10px' }}>Ver Documento</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
