import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, FileText, Trash2, Download, Eye, 
  ShieldCheck, RefreshCw, AlertCircle, Database, Search
} from 'lucide-react';

// VERSÃO ATUALIZADA
const VERSAO_ATUAL = "v33.0";

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV33() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*').order('placa', { ascending: true });
    setArquivos(docs || []);
    setFrota(veiculos || []);
  }

  const engineScanner = (nome) => {
    // Remove TUDO que não é letra ou número e põe em maiúsculo
    const n = nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Procura por 3 letras seguidas de 4 caracteres (Padrão Brasil/Mercosul)
    const regex = /[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/; 
    const regexAntiga = /[A-Z]{3}[0-9]{4}/;
    
    const match = n.match(regex) || n.match(regexAntiga);
    const placa = match ? match[0] : null;

    const isCiv = n.includes("CIV") || n.includes("CRLV") || n.includes("31");
    const isCipp = n.includes("CIPP") || n.includes("CTPP") || n.includes("52");

    return { placa, isCiv, isCipp };
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    for (const file of files) {
      const info = engineScanner(file.name);
      
      // Se não achar placa, o arquivo é ignorado para a frota
      if (!info.placa) {
        console.log("Placa não identificada no arquivo:", file.name);
        continue;
      }

      const path = `v33/${Date.now()}_${file.name}`;
      await supabase.storage.from('processos-ambientais').upload(path, file);
      const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
      
      // Salva no Repositório
      await supabase.from('arquivos_processo').insert([{ 
        nome_arquivo: file.name, url_publica: url.publicUrl, placa_relacionada: info.placa 
      }]);

      // Atualiza ou Cria na Frota
      const { data: existe } = await supabase.from('frota_veiculos').select('*').eq('placa', info.placa).maybeSingle();
      
      const dados = {
        placa: info.placa,
        motorista: "AUDITADO",
        validade_civ: info.isCiv ? "31/12/2026" : (existe?.validade_civ || "PENDENTE"),
        validade_cipp: info.isCipp ? "31/12/2026" : (existe?.validade_cipp || "PENDENTE"),
        url_doc_referencia: url.publicUrl
      };

      if (existe) {
        await supabase.from('frota_veiculos').update(dados).eq('id', existe.id);
      } else {
        await supabase.from('frota_veiculos').insert([dados]);
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const resetarBancoTotal = async () => {
    if (!confirm("Isso vai apagar TODA a frota e os arquivos. Confirmar?")) return;
    setLoading(true);
    // Deleta registros das duas tabelas
    await supabase.from('frota_veiculos').delete().neq('id', 0);
    await supabase.from('arquivos_processo').delete().neq('id', 0);
    await carregarDados();
    setLoading(false);
    alert("Sistema Resetado com Sucesso!");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO COM VERSÃO CORRIGIDA NO TÍTULO */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '5px solid #10b981' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>MAXIMUS {VERSAO_ATUAL}</h1>
          <p style={{ margin: 0, color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>CONTROLE DE FROTAS AMBIENTAIS</p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={resetarBancoTotal} style={{ backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            LIMPEZA TOTAL
          </button>
          
          <label style={{ backgroundColor: '#10b981', color: '#000', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loading ? <RefreshCw className="spin" /> : <Download size={20} />}
            {loading ? "LENDO..." : "SUBIR ARQUIVOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </header>

      <main style={{ padding: '30px' }}>
        
        {/* ABAS */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ flex: 1, padding: '20px', borderRadius: '15px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'white', color: abaAtiva === 'frota' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
             🚚 VER FROTA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('docs')} style={{ flex: 1, padding: '20px', borderRadius: '15px', border: 'none', backgroundColor: abaAtiva === 'docs' ? '#1e293b' : 'white', color: abaAtiva === 'docs' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
             📂 VER ARQUIVOS ({arquivos.length})
          </button>
        </div>

        {/* TABELA PRINCIPAL */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '3px solid #f1f5f9', color: '#94a3b8', fontSize: '14px' }}>
                  <th style={{ padding: '15px' }}>PLACA</th>
                  <th style={{ padding: '15px' }}>CIV (Validade)</th>
                  <th style={{ padding: '15px' }}>CIPP (Validade)</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {frota.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '22px', color: '#1e293b' }}>{v.placa}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ color: v.validade_civ === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_civ}</span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ color: v.validade_cipp === 'PENDENTE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{v.validade_cipp}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a href={v.url_doc_referencia} target="_blank" rel="noreferrer" style={{ color: '#10b981' }}><Eye size={30} /></a>
                    </td>
                  </tr>
                ))}
                {frota.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                      <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} /><br/>
                      Nenhuma placa detectada. O nome do arquivo deve conter algo como: **ABC1234** ou **ABC1D23**.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {arquivos.map(a => (
                <div key={a.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '15px', textAlign: 'center' }}>
                  <FileText size={35} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>{a.nome_arquivo}</div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>ID: {a.placa_relacionada}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`.spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
