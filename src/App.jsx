import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, AlertTriangle, Trash2, 
  Download, Search, Truck, Eye, ShieldCheck, RefreshCw,
  BarChart3, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Configuração Supabase
const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV20() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Estados de Resumo
  const totalVeiculos = frota.length;
  const conformes = frota.filter(v => v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE').length;
  const pendentes = totalVeiculos - conformes;

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      setArquivos(docs || []);
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setFrota(veiculos || []);
    } catch (err) { console.error("Erro na sincronização:", err); }
  }

  const extrairDadosIA = (nome) => {
    const n = nome.toUpperCase().replace(/\s/g, '');
    // Regex para capturar placas Mercosul ou Antigas
    const placaMatch = n.replace(/-/g, '').match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/);
    const placa = placaMatch ? placaMatch[0].replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
    
    // Captura datas no nome do arquivo
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
      const info = extrairDadosIA(file.name);
      const path = `auditoria_final/${Date.now()}_${file.name}`;

      // 1. Upload para o Storage
      const { error: storageErr } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (storageErr) continue;

      // 2. Pegar URL Pública
      const { data: publicRes } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: publicRes.publicUrl 
      }]);

      // 3. Lógica de Unificação (UPSERT)
      if (info.placa) {
        const { data: exist } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
        
        const updateData = {
          placa: info.placa,
          motorista: exist?.motorista || "AUDITADO EM SISTEMA",
          validade_civ: info.isCiv ? info.validade : (exist?.validade_civ || "PENDENTE"),
          validade_cipp: info.isCipp ? info.validade : (exist?.validade_cipp || "PENDENTE"),
          url_doc_referencia: publicRes.publicUrl
        };

        if (exist) {
          await supabase.from('frota_veiculos').update(updateData).eq('id', exist.id);
        } else {
          await supabase.from('frota_veiculos').insert([updateData]);
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if (!confirm("Isso apagará todas as linhas e corrigirá as duplicidades. Deseja continuar?")) return;
    setLoading(true);
    
    // Deleta registros um por um para contornar restrições de massa (Erro 400)
    const { data: f } = await supabase.from('frota_veiculos').select('id');
    if (f) for (const row of f) await supabase.from('frota_veiculos').delete().eq('id', row.id);
    
    const { data: a } = await supabase.from('arquivos_processo').select('id');
    if (a) for (const row of a) await supabase.from('arquivos_processo').delete().eq('id', row.id);

    await carregarDados();
    setLoading(false);
    alert("Sistema Resetado!");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <ShieldCheck color="#10b981" size={30} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>MAXIMUS v20</h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ padding: '14px', borderRadius: '10px', border: 'none', background: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={18}/> Auditoria
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ padding: '14px', borderRadius: '10px', border: 'none', background: abaAtiva === 'docs' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18}/> Arquivos ({arquivos.length})
          </button>
        </nav>

        <button onClick={resetTotal} style={{ padding: '14px', background: '#450a0a', color: '#fca5a5', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trash2 size={18}/> LIMPAR TUDO
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* CARDS DE RESUMO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px' }}><Truck color="#3b82f6" /></div>
            <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total de Veículos</p><h3 style={{ margin: 0 }}>{totalVeiculos}</h3></div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '10px' }}><CheckCircle color="#10b981" /></div>
            <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Conformes</p><h3 style={{ margin: 0 }}>{conformes}</h3></div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '10px' }}><AlertTriangle color="#e11d48" /></div>
            <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Pendentes</p><h3 style={{ margin: 0 }}>{pendentes}</h3></div>
          </div>
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
            <input placeholder="Buscar placa..." value={busca} onChange={e => setBusca(e.target.value.toUpperCase())} style={{ padding: '10px 10px 10px 40px', width: '300px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          
          <label style={{ padding: '12px 20px', background: '#4f46e5', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loading ? <RefreshCw className="animate-spin" size={18}/> : <Download size={18}/>}
            {loading ? "PROCESSANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
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
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_civ === 'PENDENTE' ? '#e11d48' : '#059669', fontWeight: 'bold' }}>{v.validade_civ}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ color: v.validade_cipp === 'PENDENTE' ? '#e11d48' : '#059669', fontWeight: 'bold' }}>{v.validade_cipp}</span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                        {v.url_doc_referencia && (
                          <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}><Eye size={20}/></a>
                        )}
                        {v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE' ? <CheckCircle color="#10b981" /> : <AlertTriangle color="#f59e0b" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}>
                  <FileText size={24} color="#6366f1" style={{ marginBottom: '8px', margin: '0 auto' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', wordBreak: 'break-all' }}>{a.nome_arquivo}</div>
                  <a href={a.url_publica} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none', marginTop: '10px', display: 'block' }}>ABRIR PDF</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
