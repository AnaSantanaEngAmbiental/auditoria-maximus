import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Trash2, Truck, LayoutGrid, Eye, AlertTriangle, UserCheck
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV70() {
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

  // Função para extrair placa do nome do arquivo (Ex: DPF5135 ou DPF-5135)
  const extrairPlaca = (nome) => {
    const regex = /([A-Z]{3}[0-9][A-Z0-9][0-9]{2})/i;
    const match = nome.replace("-", "").match(regex);
    return match ? match[0].toUpperCase().replace(/^([A-Z]{3})([0-9][A-Z0-9][0-9]{2})$/, "$1-$2") : null;
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    for (const file of files) {
      const nomeOriginal = file.name;
      const placaDetectada = extrairPlaca(nomeOriginal);
      const path = `auditoria/${Date.now()}_${nomeOriginal}`;

      // 1. Sobe o arquivo para o Storage
      const { error: uploadError } = await supabase.storage.from('processos-ambientais').upload(path, file);
      
      if (!uploadError) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        
        // 2. Registra o arquivo no Dossiê
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: nomeOriginal, 
          url_publica: url.publicUrl, 
          status: 'Aprovado'
        }]);

        // 3. Se detectou placa, cria o veículo na frota se ele não existir
        if (placaDetectada) {
          const { data: existe } = await supabase.from('frota_veiculos').select('id').eq('placa', placaDetectada).single();
          
          if (!existe) {
            await supabase.from('frota_veiculos').insert([{ 
              placa: placaDetectada, 
              motorista: 'IDENTIFICADO POR DOC',
              validade_civ: '2026-12-31' // Data provisória para auditoria
            }]);
          }
        }
      }
    }
    await carregarDados();
    setLoading(false);
  };

  const handleResetTotal = async () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os documentos e TODA a frota para iniciar uma nova empresa. Confirma?")) {
      setLoading(true);
      // Limpa as duas tabelas no banco
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('frota_veiculos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setArquivos([]);
      setFrota([]);
      setLoading(false);
      alert("Sistema resetado. Aguardando novos dados...");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#10b981', marginBottom: '40px' }}>MAXIMUS AI</h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <Truck size={18} /> FROTA DETECTADA ({frota.length})
          </button>
          <button onClick={() => setAbaAtiva('dossie')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'dossie' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <LayoutGrid size={18} /> DOCUMENTOS ({arquivos.length})
          </button>
        </nav>

        <button onClick={handleResetTotal} style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#450a0a', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>
          <Trash2 size={14} /> RESETAR TUDO
        </button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18}/>
            <input type="text" placeholder="Filtrar placa..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '300px' }} />
          </div>
          <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UploadCloud size={20}/> {loading ? "IDENTIFICANDO..." : "CARREGAR DADOS"}
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {abaAtiva === 'frota' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>PLACA DETECTADA</th>
                  <th style={{ padding: '15px' }}>ORIGEM</th>
                  <th style={{ padding: '15px' }}>VÍNCULO</th>
                </tr>
              </thead>
              <tbody>
                {frota.filter(f => f.placa.includes(busca.toUpperCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '15px' }}>{v.placa}</td>
                    <td style={{ padding: '15px', fontSize: '12px', color: '#64748b' }}><UserCheck size={14} style={{ verticalAlign: 'middle' }}/> Dinâmico</td>
                    <td style={{ padding: '15px' }}><CheckCircle color="#10b981" size={20}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '15px' }}>ARQUIVO</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>VER</th>
                </tr>
              </thead>
              <tbody>
                {arquivos.map(arq => (
                  <tr key={arq.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px', fontSize: '13px' }}>{arq.nome_arquivo}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <a href={arq.url_publica} target="_blank" rel="noreferrer" style={{ color: '#475569' }}><Eye size={18}/></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {frota.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
              <AlertTriangle size={40} style={{ marginBottom: '10px' }}/>
              <p>Nenhum dado carregado. Arraste os arquivos para alimentar a frota.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
