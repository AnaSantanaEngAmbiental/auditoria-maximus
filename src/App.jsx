import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';
import { 
  ShieldCheck, LayoutDashboard, Layers, Truck, 
  Calendar, FileEdit, Search, UploadCloud, FileText 
} from 'lucide-react';

const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co',
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

// MUDAMOS O NOME PARA FORÇAR ATUALIZAÇÃO
export default function MaximusSystem() {
  const [render, setRender] = useState(false);
  const [aba, setAba] = useState('DASHBOARD');
  const [items, setItems] = useState([]);
  const [empresa] = useState({ nome: 'Cardoso & Rates Engenharia', processo: '2023/12345-SEMMA' });

  // Mata o erro 418 definitivamente
  useEffect(() => {
    setRender(true);
    const fetchData = async () => {
      const { data } = await supabase.from('base_condicionantes').select('*').range(0, 100);
      if (data) setItems(data);
    };
    fetchData();
  }, []);

  const exportDoc = (formato, txt = "Documento Maximus") => {
    if (formato === 'PDF') {
      const doc = new jsPDF();
      doc.text(txt, 10, 10);
      doc.save("Maximus_Export.pdf");
    } else if (formato === 'DOCX') {
      const doc = new Document({ sections: [{ children: [new Paragraph(txt)] }] });
      Packer.toBlob(doc).then(blob => saveAs(blob, "Maximus_Word.docx"));
    }
  };

  if (!render) return <div style={{background:'#000', height:'100vh'}} />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR NOVA */}
      <aside style={{ width: '250px', background: '#080808', padding: '20px', borderRight: '1px solid #222' }}>
        <h2 style={{ color: '#25d366', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck /> MAXIMUS PhD
        </h2>
        <nav style={{ marginTop: '30px' }}>
          <button onClick={() => setAba('DASHBOARD')} style={s.btn}>Dashboard</button>
          <button onClick={() => setAba('AUDITORIA')} style={s.btn}>Auditoria</button>
          <button onClick={() => setAba('FROTA')} style={s.btn}>Frota</button>
          <button onClick={() => setAba('CRONOGRAMA')} style={s.btn}>Cronograma</button>
        </nav>
        <div style={{marginTop: '40px'}}>
           <button onClick={() => exportDoc('DOCX', "Procuração de " + empresa.nome)} style={s.btnGreen}>Gerar Procuração</button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1>{aba}</h1>
          <div style={{ border: '1px solid #25d366', padding: '5px 15px', borderRadius: '20px', color: '#25d366' }}>{empresa.nome}</div>
        </header>

        {aba === 'DASHBOARD' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={s.card}><h3>417</h3><p>Condicionantes</p></div>
            <div style={s.card}><h3>02</h3><p>Vencimentos</p></div>
            <div style={s.card}><h3>85%</h3><p>Conformidade</p></div>
          </div>
        )}

        {aba === 'AUDITORIA' && (
          <div style={{ background: '#080808', borderRadius: '10px', border: '1px solid #222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #222' }}>
                  <th style={{ padding: '15px' }}>CÓD</th>
                  <th style={{ padding: '15px' }}>DESCRIÇÃO</th>
                  <th style={{ padding: '15px' }}>EXPORTAR</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '15px', color: '#25d366' }}>{i.codigo}</td>
                    <td style={{ padding: '15px', fontSize: '12px' }}>{i['descricao de condicionante']}</td>
                    <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                       <button onClick={() => exportDoc('PDF', i['descricao de condicionante'])} style={s.miniBtn}>PDF</button>
                       <button onClick={() => exportDoc('DOCX', i['descricao de condicionante'])} style={s.miniBtn}>Word</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'FROTA' && (
          <div style={{ border: '2px dashed #333', padding: '100px', textAlign: 'center', borderRadius: '20px' }}>
            <UploadCloud size={50} color="#25d366" />
            <p>Arraste arquivos da frota para análise IA</p>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  btn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', textAlign: 'left', cursor: 'pointer' },
  btnGreen: { width: '100%', padding: '12px', background: '#25d366', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  card: { background: '#080808', padding: '20px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' },
  miniBtn: { background: '#111', border: '1px solid #333', color: '#25d366', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' }
};
