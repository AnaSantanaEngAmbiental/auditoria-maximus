import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV19() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      setArquivos(docs || []);
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(veiculos || []);
    } catch (err) { console.error("Erro na carga:", err); }
  }

  const engineInteligente = (nome) => {
    const limpo = nome.toUpperCase().replace(/\s/g, '');
    const placaMatch = limpo.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placaFinal = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    const dataMatch = nome.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const validadeFinal = dataMatch ? dataMatch[0] : "31/12/2026";

    return {
      placa: placaFinal,
      validade: validadeFinal,
      isCiv: limpo.includes("CIV") || limpo.includes("CRLV") || limpo.includes("3.1"),
      isCipp: limpo.includes("CIPP") || limpo.includes("CTPP") || limpo.includes("5.2")
    };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const meta = engineInteligente(file.name);
      const path = `maximus_auditoria/${Date.now()}_${file.name}`;

      const { error: storageErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (storageErr) continue;

      const { data: publicRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: publicRes.publicUrl 
      }]);

      if (meta.placa) {
        const { data: existe } = await supabase.from('frota_veiculos').select('*').eq('placa', meta.placa).maybeSingle();
        
        const updateObj = {
          placa: meta.placa,
          motorista: existe?.motorista || "IDENTIFICADO",
          validade_civ: meta.isCiv ? meta.validade : (existe?.validade_civ || "PENDENTE"),
          validade_cipp: meta.isCipp ? meta.validade : (existe?.validade_cipp || "PENDENTE"),
          url_doc_referencia: publicRes.publicUrl
        };

        if (existe) {
          await supabase.from('frota_veiculos').update(updateObj).eq('id', existe.id);
        } else {
          await supabase.from('frota_veiculos').insert([updateObj]);
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetForcadoTotal = async () => {
    if (!confirm("Isso apagará todas as duplicidades e arquivos para limpar o sistema. Confirma?")) return;
    setLoading(true);
    
    // Deleta por ID para contornar Erro 400 do Supabase
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const row of f) await supabase.from('frota_veiculos').delete().eq('id', row.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const row of a) await supabase.from('arquivos_processo').delete().eq('id', row.id);

    await carregarDados();
    setLoading(false);
    alert("Ambiente 100% Limpo!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <ShieldCheck color="#10b981" size={32} />
          <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px' }}>MAXIMUS v19</h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '16px', borderRadius: '12px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.2s' }}>
            <Truck size={20}/> Auditoria de Frota
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '16px', borderRadius: '12px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.2s' }}>
            <FileText size={20}/> Arquivos ({arquivos.length})
          </button>
        </nav>

        <button onClick={resetForcadoTotal} style={{ padding: '16px', background: '#450a0a', color: '#f87171', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trash2 size={18}/> LIMPAR SISTEMA
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} size={20} />
            <input placeholder="Buscar placa (ex: ABC-1234)" value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '15px 15px 15px 45px', width: '350px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <label style={{ padding: '14px 25px', background: '#4f46e5', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}>
              {loading ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
              {loading ? "PROCESSANDO..." : "IMPORTAR DOCUMENTOS"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '20px' }}>Placa do Veículo</th>
                  <th style={{ padding: '20px' }}>Validade CIV</th>
                  <th style={{ padding: '20px' }}>Validade CIPP</th>
                  <th style={{ padding: '20px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s', ':hover': { background: '#f8fafc' } }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '8px', background: v.validade_civ === 'PENDENTE' ? '#fff1f2' : '#ecfdf5', color: v.validade_civ === 'PENDENTE' ? '#e11d48' : '#059669', fontWeight: 'bold', fontSize: '14px' }}>
                        {v.validade_civ}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '8px', background: v.validade_cipp === 'PENDENTE' ? '#fff1f2' : '#ecfdf5', color: v.validade_cipp === 'PENDENTE' ? '#e11d48' : '#059669', fontWeight: 'bold', fontSize: '14px' }}>
                        {v.validade_cipp}
                      </span>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                        {v.url_doc_referencia && (
                          <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#6366f1', background: '#eef2ff', padding: '8px', borderRadius: '10px' }}>
                            <Eye size={22}/>
                          </a>
                        )}
                        {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" size={26} /> : <AlertTriangle color="#f59e0b" size={26} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', background: '#f8fafc', textAlign: 'center', position: 'relative' }}>
                  <FileText size={32} color="#6366f1" style={{ marginBottom: '12px', margin: '0 auto' }} />
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', wordBreak: 'break-all', marginBottom: '15px', height: '32px', overflow: 'hidden' }}>{a.nome_arquivo}</div>
                  <a href={a.url_publica} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px', background: '#fff', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>VISUALIZAR</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
