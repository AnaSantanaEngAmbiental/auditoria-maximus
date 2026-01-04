import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ShieldCheck, LayoutDashboard, Layers, Truck, Calendar, FileEdit, UploadCloud, FileText } from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusFinal() {
  const [mounted, setMounted] = useState(false);
  const [aba, setAba] = useState('DASHBOARD');
  const [items, setItems] = useState([]);

  useEffect(() => {
    setMounted(true);
    const getData = async () => {
      const { data } = await supabase.from('base_condicionantes').select('*').limit(50);
      if (data) setItems(data);
    };
    getData();
  }, []);

  const gerarDoc = (formato, item) => {
    const nome = item ? `Oficio_${item.codigo}` : "Procuracao_Geral";
    const texto = item ? item['descricao de condicionante'] : "Pelo presente instrumento, nomeamos Cardoso & Rates...";

    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.text(texto, 10, 20);
      doc.save(`${nome}.pdf`);
    } else if (formato === 'DOCX') {
      const doc = new Document({
        sections: [{ children: [new Paragraph({ children: [new TextRun({ text: texto, bold: true })] })] }]
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${nome}.docx`));
    }
  };

  if (!mounted) return <div style={{background: '#001529', height: '100vh'}} />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#001529', color: '#fff', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '250px', background: '#000c17', padding: '20px', borderRight: '1px solid #1890ff' }}>
        <h2 style={{ color: '#1890ff' }}><ShieldCheck /> MAXIMUS v74</h2>
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setAba('DASHBOARD')} style={st.btn}>Dashboard</button>
          <button onClick={() => setAba('AUDITORIA')} style={st.btn}>Auditoria Técnica</button>
          <button onClick={() => setAba('FROTA')} style={st.btn}>Frota</button>
          <button onClick={() => gerarDoc('DOCX')} style={st.btnBlue}>Gerar Procuração</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h1 style={{borderBottom: '2px solid #1890ff', paddingBottom: '10px'}}>{aba}</h1>

        {aba === 'DASHBOARD' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
            <div style={st.card}><h3>417</h3><p>Itens Lidos</p></div>
            <div style={st.card}><h3>PDF / DOCX</h3><p>Exportação Ativa</p></div>
            <div style={st.card}><h3>MAXIMUS</h3><p>v74 PhD</p></div>
          </div>
        )}

        {aba === 'AUDITORIA' && (
          <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#000c17', textAlign: 'left' }}>
                <th style={st.th}>CÓD</th>
                <th style={st.th}>DESCRIÇÃO</th>
                <th style={st.th}>AÇÕES (PDF/WORD)</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ padding: '15px', color: '#1890ff' }}>{i.codigo}</td>
                  <td style={{ padding: '15px', fontSize: '11px' }}>{i['descricao de condicionante']}</td>
                  <td style={{ padding: '15px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => gerarDoc('PDF', i)} style={st.miniBtn}>PDF</button>
                    <button onClick={() => gerarDoc('DOCX', i)} style={st.miniBtn}>DOCX</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {aba === 'FROTA' && (
          <div style={{ border: '2px dashed #1890ff', padding: '100px', textAlign: 'center', marginTop: '20px' }}>
            <UploadCloud size={60} color="#1890ff" />
            <p>Módulo de Frota PhD: Arraste os arquivos aqui</p>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  btn: { padding: '12px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' },
  btnBlue: { padding: '12px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  card: { background: '#000c17', padding: '30px', borderRadius: '15px', border: '1px solid #1890ff', textAlign: 'center' },
  th: { padding: '15px', color: '#1890ff' },
  miniBtn: { background: '#001529', border: '1px solid #1890ff', color: '#fff', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }
};
