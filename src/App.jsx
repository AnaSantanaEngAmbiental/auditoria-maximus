import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Truck, UploadCloud, FileText, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV105() {
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtiva, setUnidadeAtiva] = useState(null);
  const [frotaLocal, setFrotaLocal] = useState([]); // Caminhões da empresa
  const [extratoANTT, setExtratoANTT] = useState([]); // Caminhões no PDF da ANTT
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('DASHBOARD');

  // Carregamento Inicial Seguro
  const init = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.from('unidades_maximus').select('*');
    if (u && u.length > 0) {
      setUnidades(u);
      setUnidadeAtiva(u[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  // FUNÇÃO PHD: Comparação Automática ANTT
  const compararANTT = () => {
    return frotaLocal.map(veiculo => {
      const naANTT = extratoANTT.find(a => a.placa === veiculo.placa);
      return { ...veiculo, regularizado: !!naANTT };
    });
  };

  // Simulador de Arraste e Cole (Lógica de Engenharia)
  const handleFileUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulação de processamento de texto/placas
    if (tipo === 'FROTA') {
      setFrotaLocal([{ placa: 'ABC1234' }, { placa: 'PHD2026' }]);
    } else {
      setExtratoANTT([{ placa: 'ABC1234' }]); // Só um está na ANTT
    }
    alert(`${tipo} carregado com sucesso!`);
  };

  if (loading) return <div style={s.load}>REINICIANDO NÚCLEO MAXIMUS...</div>;

  return (
    <div style={s.app}>
      <aside style={s.side}>
        <div style={s.logo}><ShieldCheck color="#0f0"/> MAXIMUS PhD</div>
        
        <select style={s.select} onChange={(e) => setUnidadeAtiva(unidades.find(u => u.id === e.target.value))}>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.razao_social || u.id}</option>)}
        </select>

        <nav style={s.nav}>
          <button onClick={() => setAba('DASHBOARD')} style={aba === 'DASHBOARD' ? s.btnA : s.btn}><Database/> Dashboard</button>
          <button onClick={() => setAba('ANTT')} style={aba === 'ANTT' ? s.btnA : s.btn}><Truck/> Comparador ANTT</button>
        </nav>
      </aside>

      <main style={s.main}>
        {aba === 'ANTT' ? (
          <div style={s.grid}>
            <div style={s.card}>
              <h3>1. Frota da Empresa (.xlsx)</h3>
              <input type="file" onChange={(e) => handleFileUpload(e, 'FROTA')} />
            </div>
            <div style={s.card}>
              <h3>2. Extrato ANTT (.pdf)</h3>
              <input type="file" onChange={(e) => handleFileUpload(e, 'ANTT')} />
            </div>

            <div style={{gridColumn: '1 / -1'}}>
               <table style={s.table}>
                 <thead>
                   <tr>
                     <th>PLACA</th>
                     <th>STATUS ANTT</th>
                     <th>AÇÃO</th>
                   </tr>
                 </thead>
                 <tbody>
                   {compararANTT().map(v => (
                     <tr key={v.placa}>
                       <td>{v.placa}</td>
                       <td>
                         {v.regularizado ? 
                           <span style={{color: '#0f0'}}><CheckCircle2 size={16}/> REGULAR</span> : 
                           <span style={{color: '#f00'}}><AlertTriangle size={16}/> NÃO CONSTA NO EXTRATO</span>
                         }
                       </td>
                       <td><button style={s.miniBtn}>Notificar Cliente</button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        ) : (
          <div style={s.central}>
            <h1>Bem-vindo ao Maximus PhD</h1>
            <p>Unidade Ativa: {unidadeAtiva?.razao_social || 'Selecione uma empresa'}</p>
            <div style={s.stats}>
                <div style={s.statBox}><h3>89%</h3><p>Conformidade</p></div>
                <div style={s.statBox}><h3>12</h3><p>Vencimentos</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' },
  side: { width: 300, background: '#080808', padding: 30, borderRight: '1px solid #111' },
  logo: { fontSize: 24, fontWeight: 900, color: '#0f0', marginBottom: 40, display: 'flex', gap: 10 },
  select: { width: '100%', padding: 15, background: '#111', color: '#fff', borderRadius: 8, border: '1px solid #333' },
  nav: { marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 },
  btn: { display: 'flex', gap: 10, padding: 15, background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18 },
  btnA: { display: 'flex', gap: 10, padding: 15, background: '#111', border: '1px solid #0f0', color: '#0f0', borderRadius: 8, cursor: 'pointer', fontSize: 18 },
  main: { flex: 1, padding: 40, overflowY: 'auto' },
  load: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0', background: '#000' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: '#080808', padding: 30, borderRadius: 20, border: '1px solid #222' },
  table: { width: '100%', marginTop: 30, borderCollapse: 'collapse', background: '#050505', borderRadius: 15 },
  statBox: { background: '#111', padding: 30, borderRadius: 20, textAlign: 'center', minWidth: 150 },
  stats: { display: 'flex', gap: 20, marginTop: 40 },
  central: { textAlign: 'center', marginTop: 100 },
  miniBtn: { background: '#0f0', color: '#000', border: 'none', padding: '5px 10px', borderRadius: 5, fontWeight: 'bold' }
};
