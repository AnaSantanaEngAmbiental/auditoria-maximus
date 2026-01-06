import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import SignatureCanvas from 'react-signature-canvas'; // Instale: npm install react-signature-canvas
import { jsPDF } from 'jspdf';
import { 
  ShieldCheck, Gavel, PenTool, Download, 
  Save, FileText, CheckCircle2, Eraser 
} from 'lucide-react';

const supabase = createClient('SUA_URL', 'SUA_KEY');

export default function MaximusV125() {
  const [isClient, setIsClient] = useState(false);
  const [texto, setTexto] = useState("Pelo presente instrumento...");
  const [unidadeAtiva, setUnidadeAtiva] = useState(null);
  const sigCanvas = useRef({});

  useEffect(() => { setIsClient(true); }, []);

  // LIMPAR ASSINATURA
  const limparAssinatura = () => sigCanvas.current.clear();

  // SALVAR TUDO NO SUPABASE (Texto + Assinatura)
  const finalizarDocumento = async () => {
    const assinaturaData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    
    // Salva a assinatura vinculada à unidade
    const { error } = await supabase.from('assinaturas_digitais').upsert({
      projeto_id: unidadeAtiva?.id,
      documento_tipo: 'PROCURACAO',
      assinatura_base64: assinaturaData
    });

    if(!error) alert("Documento e Assinatura salvos com sucesso!");
  };

  if (!isClient) return null;

  return (
    <div style={s.app}>
      <aside style={s.side}>
        <div style={s.logo}><ShieldCheck color="#25d366"/> MAXIMUS PhD</div>
        <p style={{fontSize: 12, color: '#444'}}>MÓDULO JURÍDICO ATIVO</p>
      </aside>

      <main style={s.main}>
        <div style={s.editorGrid}>
          {/* LADO ESQUERDO: EDITOR DE TEXTO */}
          <div style={s.card}>
            <h3><PenTool size={18}/> Redação do Documento (Editável)</h3>
            <textarea 
              style={s.textarea} 
              value={texto} 
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          {/* LADO DIREITO: ASSINATURA DIGITAL */}
          <div style={s.card}>
            <h3><Gavel size={18}/> Assinatura Digital do Cliente</h3>
            <div style={s.canvasWrap}>
              <SignatureCanvas 
                ref={sigCanvas}
                penColor='white'
                canvasProps={{width: 400, height: 200, className: 'sigCanvas'}} 
              />
            </div>
            <div style={s.btnGroup}>
              <button onClick={limparAssinatura} style={s.btnSec}><Eraser size={16}/> Limpar</button>
              <button onClick={finalizarDocumento} style={s.btnPri}><Save size={16}/> Finalizar e Salvar</button>
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.btnWord}><FileText/> Baixar .DOCX Editável</button>
          <button style={s.btnPdf}><Download/> Gerar PDF Assinado</button>
        </div>
      </main>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#000', color: '#fff' },
  side: { width: 280, background: '#080808', padding: 30, borderRight: '1px solid #111' },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#25d366', marginBottom: 50 },
  main: { flex: 1, padding: 40, overflowY: 'auto' },
  editorGrid: { display: 'grid', gridTemplateColumns: '1fr 450px', gap: 20 },
  card: { background: '#080808', padding: 25, borderRadius: 20, border: '1px solid #111' },
  textarea: { width: '100%', height: '400px', background: 'transparent', color: '#ccc', border: 'none', outline: 'none', fontSize: 18, lineHeight: 1.6, fontFamily: 'serif' },
  canvasWrap: { background: '#111', borderRadius: 10, marginTop: 20, border: '1px dashed #333' },
  btnGroup: { display: 'flex', gap: 10, marginTop: 20 },
  btnPri: { flex: 1, background: '#25d366', color: '#000', border: 'none', padding: 15, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 10 },
  btnSec: { background: '#111', color: '#fff', border: '1px solid #333', padding: 15, borderRadius: 8, cursor: 'pointer' },
  footer: { marginTop: 30, display: 'flex', gap: 20 },
  btnWord: { background: '#2b579a', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 10, cursor: 'pointer', display:'flex', gap: 10 },
  btnPdf: { background: '#e01c1c', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 10, cursor: 'pointer', display:'flex', gap: 10 },
};
