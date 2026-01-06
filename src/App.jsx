import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração robusta do Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const supabase = createClient('SUA_URL', 'SUA_KEY');

export default function MaximusOCR_Final() {
  const [unidadeAtiva, setUnidadeAtiva] = useState(null);
  const [divergencias, setDivergencias] = useState([]);
  const [isAnalisando, setIsAnalisando] = useState(false);

  // MOTOR OCR PARA EXTRATO ANTT
  const processarArquivos = async (files) => {
    setIsAnalisando(true);
    let todasPlacasDetectadas = [];

    for (const file of files) {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async () => {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let text = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(" ");
          }

          // Regex para placas Mercosul e Antigas
          const regexPlacas = /[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g;
          const detectadas = text.match(regexPlacas) || [];
          validarDivergencias(detectadas);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const validarDivergencias = async (placasANTT) => {
    if (!unidadeAtiva) return alert("Selecione uma Unidade antes!");

    // Busca frota oficial da empresa no Supabase
    const { data: frotaSupabase } = await supabase
      .from('frota_veiculos')
      .select('placa')
      .eq('unidade_id', unidadeAtiva.id);

    const placasOficiais = frotaSupabase?.map(v => v.placa) || [];
    
    // Comparação: O que está na frota mas NÃO está no PDF da ANTT
    const erros = placasOficiais.filter(p => !placasANTT.includes(p));
    
    setDivergencias(erros);
    setIsAnalisando(false);
  };

  return (
    <div style={s.app}>
      {/* CORREÇÃO DO ERRO DE TELA BRANCA: Verificação de unidadeAtiva */}
      <div style={s.card}>
        <h2><Truck /> Comparador ANTT Automático</h2>
        <p>Unidade: <strong>{unidadeAtiva?.razao_social || "Selecione uma empresa..."}</strong></p>
        
        <div 
          style={s.dropzone}
          onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
        >
          {isAnalisando ? "PhD Analisando Documentos..." : "Arraste o Extrato ANTT (.pdf) aqui"}
        </div>

        {divergencias.length > 0 && (
          <div style={s.alertBox}>
            <h3>🚨 Divergências Detectadas:</h3>
            <ul>
              {divergencias.map(p => (
                <li key={p}>Placa {p}: Não localizada no Extrato ANTT.</li>
              ))}
            </ul>
            <button style={s.btnNotificar}>Notificar Cliente via WhatsApp</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  app: { background: '#000', color: '#fff', minHeight: '100vh', padding: '40px' },
  card: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #111' },
  dropzone: { border: '2px dashed #25d366', padding: '60px', borderRadius: '15px', textAlign: 'center', margin: '20px 0', cursor: 'pointer' },
  alertBox: { background: '#1a0505', border: '1px solid #ff4d4d', padding: '20px', borderRadius: '10px', marginTop: '20px' },
  btnNotificar: { background: '#25d366', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};
