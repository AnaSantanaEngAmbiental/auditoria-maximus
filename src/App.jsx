import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, Trash2, Download, Eye, 
  ShieldCheck, RefreshCw, AlertCircle, HardDrive, 
  Search, Filter, List
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusMasterV30() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Garantia de Renderização (Anti-Erro 418)
  useEffect(() => {
    setIsClient(true);
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
      const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
      setArquivos(docs || []);
      setFrota(veiculos || []);
    } catch (error) {
      console.error("Erro na sincronização:", error);
    }
  };

  const extrairPlacaEspecilista = (nomeOriginal) => {
    const limpo = nomeOriginal.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Padrão Mercosul (Letra, Letra, Letra, Num, Letra, Num, Num)
    const regexMercosul = /[A-Z]{3}[0-9][A-Z][0-9]{2}/;
    // Padrão Antigo (Letra, Letra, Letra, Num, Num, Num, Num)
    const regexAntigo = /[A-Z]{3}[0-9]{4}/;

    const match = limpo.match(regexMercosul) || limpo.match(regexAntigo);
    const placa = match ? match[0] : null;

    // Detecção de Documento por Palavra-Chave ou Código Numérico
    const isCiv = limpo.includes("CIV") || limpo.includes("CRLV") || limpo.includes("31") || limpo.includes("INSPECAO");
    const isCipp = limpo.includes("CIPP") || limpo.includes("CTPP") || limpo.includes("52") || limpo.includes("PERIGOSOS");

    return { placa, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = extrairPlacaEspecilista(file.name);
      
      // Se não identificar a placa, ignoramos para não sujar a frota, mas poderíamos logar
      if (!info.placa) continue;

      const fileNamePath = `master_v30/${Date.now()}_${file.name}`;
      
      const { error: storageError } = await supabase.storage.from('processos-ambientais').upload(fileNamePath, file);
      if (storageError) continue;

      const { data: urlData } = supabase.storage.from('processos-ambientais').getPublicUrl(fileNamePath);
      const publicUrl = urlData.publicUrl;

      // 1. Registro no Histórico de Arquivos
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, 
        url_publica: publicUrl, 
        placa_relacionada: info.placa 
      }]);

      // 2. Lógica de Inteligência de Frota (UPSERT)
      const { data: registroExistente } = await supabase.from('frota_veiculos')
        .select('*')
        .eq('placa', info.placa)
        .maybeSingle();

      const payload = {
        placa: info.placa,
        motorista: "MOTORISTA PADRÃO",
        validade_civ: info.isCiv ? "31/12/2026" : (registroExistente?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (registroExistente?.validade_cipp || "PENDENTE"),
        url_doc_referencia: publicUrl // Mantém o link do último documento enviado
      };

      if (registroExistente) {
        await supabase.from('frota_veiculos').update(payload).eq('id', registroExistente.id);
      } else {
        await supabase.from('frota_veiculos').insert([payload]);
      }
    }

    await carregarDados();
    setLoading(false);
  };

  const resetTotal = async () => {
    if (!window.confirm("ATENÇÃO: Isso removerá todos os registros de frota e arquivos. Deseja prosseguir?")) return;
    setLoading(true);
    try {
      await supabase.rpc('truncate_all_tables'); // Caso tenha essa função, ou deletamos manual:
      const { data: f } = await supabase.from('frota_veiculos').select('id');
      if (f) for (let item of f) await supabase.from('frota_veiculos').delete().eq('id', item.id);
      const { data: a } = await supabase.from('arquivos_processo').select('id');
      if (a) for (let item of a) await supabase.from('arquivos_processo').delete().eq('id', item.id);
      await carregarDados();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!isClient) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fa', fontFamily: 'Inter, system-ui, sans-serif', color: '#1a202c' }}>
      
      {/* HEADER MASTER FIXO */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '10px' }}>
            <ShieldCheck color="white" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>MAXIMUS <span style={{ color: '#10b981' }}>MASTER v30</span></h1>
            <span style={{ fontSize: '11px', color: '#718096', fontWeight: '600' }}>SISTEMA DE AUDITORIA AMBIENTAL</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={resetTotal} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
            <Trash2 size={16} /> RESETAR SISTEMA
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#2d3748', color: 'white', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {loading ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
            {loading ? "PROCESSANDO..." : "CARREGAR DOCUMENTOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        
        {/* DASHBOARD DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <MetricCard title="Total Frota" value={frota.length} icon={<Truck size={20} color="#4f46e5"/>} />
          <MetricCard title="Conformes" value={frota.filter(v => v.validade_civ !== 'PENDENTE' && v.validade_cipp !== 'PENDENTE').length} icon={<CheckCircle size={20} color="#10b981"/>} border="#10b981" />
          <MetricCard title="Pendentes" value={frota.filter(v => v.validade_civ === 'PENDENTE' || v.validade_cipp === 'PENDENTE').length} icon={<AlertCircle size={20} color="#f59e0b"/>} border="#f59e0b" />
          <MetricCard title="Arquivos" value={arquivos.length} icon={<HardDrive size={20} color="#718096"/>} />
        </div>

        {/* CONTROLES DE TABELA */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '12px' }}>
              <TabButton active={abaAtiva === 'frota'} onClick={() => setAbaAtiva('frota')} label="FROTA" icon={<List size={16}/>} />
              <TabButton active={abaAtiva === 'docs'} onClick={() => setAbaAtiva('docs')} label="REPOSITÓRIO" icon={<HardDrive size={16}/>} />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} size={16} />
              <input 
                type="text" 
                placeholder="Buscar placa..." 
                value={filtro} 
                onChange={(e) => setFiltro(e.target.value.toUpperCase())}
                style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', width: '250px' }}
              />
            </div>
          </div>

          {/* TABELA DE RESULTADOS */}
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={thStyle}>VEÍCULO / PLACA</th>
                  <th style={thStyle}>STATUS CIV (3.1)</th>
                  <th style={thStyle}>STATUS CIPP (5.2)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>DOCUMENTO</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(v => v.placa.includes(filtro)).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '20px', fontWeight: '800', fontSize: '16px', color: '#2d3748' }}>{v.placa}</td>
                    <td style={{ padding: '20px' }}><Badge status={v.validade_civ} /></td>
                    <td style={{ padding: '20px' }}><Badge status={v.validade_cipp} /></td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '8px', borderRadius: '8px', display: 'inline-flex' }}>
                        <Eye size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#fdfdfd' }}>
                  <FileText color="#4f46e5" size={28} style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a202c', wordBreak: 'break-all', height: '32px', overflow: 'hidden' }}>{a.nome_arquivo}</div>
                  <div style={{ marginTop: '10px', fontSize: '10px', color: '#10b981', fontWeight: '800' }}>PLACA: {a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// COMPONENTES AUXILIARES
function MetricCard({ title, value, icon, border = '#e2e8f0' }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', borderLeft: `6px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>{title}</span>
        {icon}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '10px' }}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', borderRadius: '10px', border: 'none', backgroundColor: active ? 'white' : 'transparent', color: active ? '#1a202c' : '#718096', fontWeight: 'bold', cursor: 'pointer', boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: '0.2s' }}>
      {icon} {label}
    </button>
  );
}

function Badge({ status }) {
  const isPendente = status === 'PENDENTE';
  return (
    <span style={{ backgroundColor: isPendente ? '#fff5f5' : '#f0fff4', color: isPendente ? '#c53030' : '#22863a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {isPendente ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
      {status}
    </span>
  );
}

const thStyle = { padding: '15px 20px', fontSize: '12px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' };
