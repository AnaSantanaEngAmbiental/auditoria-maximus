import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UploadCloud, Search, CheckCircle, XCircle, FileBarChart, 
  Printer, X, Trash2, Truck, LayoutGrid, Eye, AlertTriangle, UserMinus, UserCheck
} from 'lucide-react';

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function MaximusV62() {
  const [arquivos, setArquivos] = useState([]);
  const [frota, setFrota] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('frota');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: docs } = await supabase.from('arquivos_processo').select('*').order('created_at', { ascending: false });
    if (docs) setArquivos(docs);
    const { data: veiculos } = await supabase.from('frota_veiculos').select('*');
    if (veiculos) setFrota(veiculos);
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    for (const file of files) {
      const nomeLimpo = file.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      const path = `auditoria/${Date.now()}_${nomeLimpo}`;

      const { error } = await supabase.storage.from('processos-ambientais').upload(path, file);
      if (!error) {
        const { data: url } = supabase.storage.from('processos-ambientais').getPublicUrl(path);
        await supabase.from('arquivos_processo').insert([{ 
          nome_arquivo: file.name, 
          url_publica: url.publicUrl, 
          status: 'Aprovado',
          empresa_cnpj: '38.404.019/0001-76'
        }]);
      }
    }
    carregarDados();
    setLoading(false);
  };

  const handleReset = async () => {
    if (window.confirm("Deseja resetar a auditoria?")) {
      setLoading(true);
      await supabase.from('arquivos_processo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      carregarDados();
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>MAXIMUS v6.2</h1>
        <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '40px' }}>AUDITORIA DE FROTA E RH</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAbaAtiva('frota')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'frota' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <Truck size={18} /> GESTÃO DE FROTA
          </button>
          <button onClick={() => setAbaAtiva('dossie')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'dossie' ? '#1e293b' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <LayoutGrid size={18} /> ARQUIVOS RECEBIDOS
          </button>
        </nav>

        <button onClick={handleReset} style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>
          <Trash2 size={14} /> RESETAR AUDITORIA
        </button>
      </aside>

      {/* CONTEUDO */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <input 
            type="text" placeholder="Filtrar placa, motorista ou status..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '350px' }}
          />
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setMostrarRelatorio(true)} style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>RELATÓRIO PDF</button>
            <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? "PROCESSANDO..." : "CARREGAR EVIDÊNCIA"}
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
          </div>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                <th style={{ padding: '15px' }}>VEÍCULO / MOTORISTA</th>
                <th style={{ padding: '15px' }}>SITUAÇÃO EMPRESA</th>
                <th style={{ padding: '15px' }}>SITUAÇÃO CIV</th>
                <th style={{ padding: '15px' }}>VÍNCULO DOC</th>
              </tr>
            </thead>
            <tbody>
              {frota.filter(f => f.placa.includes(busca.toUpperCase()) || f.motorista.includes(busca.toUpperCase())).map(v => {
                const placaLimpa = v.placa.replace("-", "").toLowerCase();
                const temDoc = arquivos.some(a => a.nome_arquivo.toLowerCase().replace(/[^a-z0-9]/g, "").includes(placaLimpa));
                const motoristaDesligado = ["ADRIANO SILVA MOTA", "MANOEL RICARDO DIAS MARINHO", "DHEYNER PEDRINO DE MIRANDA"].includes(v.motorista.toUpperCase());
                const civVencido = v.validade_civ && new Date(v.validade_civ) < new Date();

                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{v.placa}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{v.motorista}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {motoristaDesligado ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}><UserMinus size={14}/> DESLIGADO</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}><UserCheck size={14}/> ATIVO</span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {civVencido ? (
                        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' }}>VENCIDO ({v.validade_civ})</span>
                      ) : (
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' }}>REGULAR</span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {temDoc ? <CheckCircle color="#10b981" size={20}/> : <AlertTriangle color="#f59e0b" size={20}/>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* RELATÓRIO PDF */}
      {mostrarRelatorio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', padding: '40px', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '850px', padding: '50px', borderRadius: '10px', overflowY: 'auto' }}>
            <div id="print-area">
              <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' }}>AUDITORIA DE CONFORMIDADE CAELI - JULHO 2025</h2>
              <p><strong>Diagnóstico Geral:</strong> Dos motoristas listados, 3 foram identificados como desligados. Os veículos SZH-2H06 e SZV-2C77 constam com CIV expirado no sistema.</p>
              <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                <tr style={{ backgroundColor: '#eee' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>PLACA</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>MOTORISTA</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>STATUS EMPRESA</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>STATUS CIV</th>
                </tr>
                {frota.map(v => (
                  <tr key={v.id}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{v.placa}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{v.motorista}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{["ADRIANO SILVA MOTA", "MANOEL RICARDO DIAS MARINHO", "DHEYNER PEDRINO DE MIRANDA"].includes(v.motorista.toUpperCase()) ? "DESLIGADO" : "ATIVO"}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{new Date(v.validade_civ) < new Date() ? "VENCIDO" : "OK"}</td>
                  </tr>
                ))}
              </table>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '15px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>IMPRIMIR AGORA</button>
              <button onClick={() => setMostrarRelatorio(false)} style={{ padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px', cursor: 'pointer' }}>FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
