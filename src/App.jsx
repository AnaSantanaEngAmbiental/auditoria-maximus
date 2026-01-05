import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ShieldCheck, FileText, Truck, Scale, Search, 
  RotateCcw, CheckCircle2, AlertTriangle, Save, 
  MapPin, UploadCloud, ClipboardCheck 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusV92() {
  const [unidades, setUnidades] = useState([]);
  const [ativa, setAtiva] = useState(null);
  const [items, setItems] = useState([]);
  const [auditMap, setAuditMap] = useState({});
  const [aba, setAba] = useState('AUDITORIA');
  const [loading, setLoading] = useState(true);

  // 1. CARREGAMENTO COM VARREDURA DE SEGURANÇA
  const carregarUnidades = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('unidades_maximus').select('*');
    if (data?.length > 0) {
      setUnidades(data);
      setAtiva(data[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregarUnidades(); }, [carregarUnidades]);

  // 2. SINCRONIA DE ITENS (SEMAS + ANTT)
  useEffect(() => {
    if (ativa?.id) {
      const fetchAuditoria = async () => {
        const [resBase, resItens] = await Promise.all([
          supabase.from('base_condicionantes').select('*').order('codigo'),
          supabase.from('auditoria_itens').select('*').eq('projeto_id', ativa.id)
        ]);
        setItems(resBase.data || []);
        const map = {};
        resItens.data?.forEach(r => map[r.codigo_item] = r);
        setAuditMap(map);
      };
      fetchAuditoria();
    }
  }, [ativa]);

  // 3. ENGENHARIA DE DOCUMENTOS (PDF PROFISSIONAL)
  const imprimirOficio = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`OFÍCIO DE CONFORMIDADE AMBIENTAL - ${ativa.id}`, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`EMPRESA: ${ativa.razao_social}`, 14, 35);
    doc.text(`PROCESSO: ${ativa.processo_numero}`, 14, 42);
    
    const body = items.map(it => [
      it.codigo, 
      it.descricao_de_condicionante?.substring(0, 80),
      auditMap[it.codigo]?.placa_veiculo || '-',
      auditMap[it.codigo]?.conformidade ? 'CONFORME' : 'PENDENTE'
    ]);

    doc.autoTable({
      startY: 50,
      head: [['ITEM', 'DESCRIÇÃO', 'PLACA', 'STATUS']],
      body: body,
      headStyles: { fillColor: [0, 80, 0] }
    });

    doc.save(`OFICIO_MAXIMUS_${ativa.id}.pdf`);
  };

  if (loading) return <div style={s.load}><RotateCcw className="animate-spin" size={50}/> <span>REVISANDO SQL PhD...</span></div>;

  return (
    <div style={s.app}>
      {/* SIDEBAR - NÍVEL 20 */}
      <aside style={s.side}>
        <div style={s.logo}><ShieldCheck color="#0f0" size={35}/> MAXIMUS PhD</div>
        
        <div style={s.selectGroup}>
          <label style={s.miniLabel}>UNIDADE TÉCNICA:</label>
          <select style={s.select} value={ativa?.id} onChange={e => setAtiva(unidades.find(u => u.id === e.target.value))}>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.razao_social}</option>)}
          </select>
        </div>

        <nav style={s.nav}>
          <button onClick={()=>setAba('AUDITORIA')} style={aba==='AUDITORIA'?s.btnA:s.btn}><Scale/> Auditoria</button>
          <button onClick={()=>setAba('DOCS')} style={aba==='DOCS'?s.btnA:s.btn}><FileText/> Fábrica de Docs</button>
          <button onClick={()=>setAba('MAPA')} style={aba==='MAPA'?s.btnA:s.btn}><MapPin/> Geolocalização</button>
        </nav>
      </aside>

      {/* ÁREA DE TRABALHO - FONTE IMPACTANTE */}
      <main style={s.main}>
        {aba === 'AUDITORIA' ? (
          <div style={s.card}>
            <table style={s.table}>
              <thead>
                <tr style={s.th}>
                  <th style={{width: 80}}>ID</th>
                  <th>REQUISITO AMBIENTAL</th>
                  <th>PLACA/ANTT</th>
                  <th>CONFORMIDADE</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} style={s.tr}>
                    <td style={s.tdId}>{it.codigo}</td>
                    <td style={s.tdDesc}>{it.descricao_de_condicionante}</td>
                    <td>
                      <input 
                        style={s.input} 
                        defaultValue={auditMap[it.codigo]?.placa_veiculo}
                        onBlur={async (e) => {
                          await supabase.from('auditoria_itens').upsert({
                            projeto_id: ativa.id,
                            codigo_item: it.codigo,
                            placa_veiculo: e.target.value
                          });
                        }}
                      />
                    </td>
                    <td>
                      <div style={auditMap[it.codigo]?.conformidade ? s.statusG : s.statusR}>
                        {auditMap[it.codigo]?.conformidade ? 'CONFORME' : 'ANALISAR'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={s.gridDocs}>
             <div style={s.docCard} onClick={imprimirOficio}>
                <FileText size={80} color="#0f0"/>
                <h2>Gerar Ofício Requerimento</h2>
                <p>Padrão PhD em Redação para SEMAS/PA.</p>
             </div>
             <div style={s.docCard}>
                <Truck size={80} color="#0f0"/>
                <h2>Exportar Checklist ANTT</h2>
                <p>Verificação de frota e certificados perigosos.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff', fontSize: '20px' },
  load: { height: '100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#0f0', gap:20, background:'#000' },
  side: { width: 380, background: '#080808', padding: 35, borderRight: '1px solid #111' },
  logo: { fontSize: 35, fontWeight: 900, color: '#0f0', marginBottom: 50, display:'flex', gap: 12 },
  miniLabel: { fontSize: 12, color: '#444', marginBottom: 8, display: 'block' },
  select: { width: '100%', padding: 20, background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 12, fontSize: 18 },
  nav: { marginTop: 40, display: 'flex', flexDirection: 'column', gap: 15 },
  btn: { display: 'flex', gap: 15, padding: 22, background: 'none', border: 'none', color: '#333', fontSize: 22, cursor: 'pointer', textAlign: 'left' },
  btnA: { display: 'flex', gap: 15, padding: 22, background: '#111', border: '1px solid #0f0', color: '#0f0', fontSize: 22, borderRadius: 12, textAlign: 'left' },
  main: { flex: 1, padding: 40, overflowY: 'auto' },
  card: { background: '#050505', borderRadius: 25, border: '1px solid #111', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0a0a0a', textAlign: 'left', color: '#333', fontSize: 14, padding: 20 },
  tr: { borderBottom: '1px solid #0f0f0f' },
  tdId: { padding: 35, fontSize: 42, fontWeight: 900, color: '#0f0' },
  tdDesc: { padding: 25, fontSize: 19, color: '#ccc', lineHeight: 1.5 },
  input: { background: '#000', border: '1px solid #222', color: '#fff', padding: 12, borderRadius: 8, width: '150px', fontSize: 16 },
  statusG: { background: '#0f02', color: '#0f0', padding: '10px 20px', borderRadius: 30, fontSize: 14, textAlign:'center' },
  statusR: { background: '#f001', color: '#f44', padding: '10px 20px', borderRadius: 30, fontSize: 14, textAlign:'center' },
  gridDocs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 },
  docCard: { background: '#080808', padding: 60, borderRadius: 35, border: '1px solid #111', textAlign: 'center', cursor: 'pointer' },
  selectGroup: { marginBottom: 30 }
};
