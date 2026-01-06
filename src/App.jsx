import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, CheckCircle, Zap, FileText, AlertCircle } from 'lucide-react';

// --- COLOQUE SUAS CHAVES AQUI ---
const supabase = createClient(
  'https://gmhxmtlidgcgpstxiiwg.supabase.co', 
  'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'
);

export default function MaximusSistemaPhD() {
  const [isClient, setIsClient] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ frota: 0, docs: 0 });

  // Resolve erro #418 e inicia Worker do PDF
  useEffect(() => {
    setIsClient(true);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    atualizarDashboard();
  }, []);

  const atualizarDashboard = async () => {
    const { count: f } = await supabase.from('frota_veiculos').select('*', { count: 'exact' });
    const { count: d } = await supabase.from('documentos_processados').select('*', { count: 'exact' });
    setStats({ frota: f || 0, docs: d || 0 });
  };

  const processarArquivos = async (files) => {
    const lista = Array.from(files);
    for (const file of lista) {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let texto = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texto += content.items.map(s => s.str).join(" ");
        }
        classificarIA(texto, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const classificarIA = async (texto, nome) => {
    let detectado = { tipo: "Outros", dados: {} };

    // Identifica CRLV (Placas TVO)
    if (texto.includes("RENAVAM") || texto.includes("LICENCIAMENTO")) {
      detectado.tipo = "CRLV";
      detectado.dados.placa = texto.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g)?.[0];
    } 
    // Identifica Nota Fiscal (Chassis BADY)
    else if (texto.includes("DANFE") || texto.includes("RANDON")) {
      detectado.tipo = "NOTA FISCAL";
      detectado.dados.chassi = texto.match(/[A-Z0-9]{17}/)?.[0];
    }
    // Identifica SEMAS (Processo 2025/...)
    else if (texto.includes("SEMAS") || texto.includes("Processo")) {
      detectado.tipo = "SEMAS/OFICIO";
      detectado.dados.processo = texto.match(/\d{4}\/\d+/g)?.[0];
    }

    // Salva no Supabase
    await supabase.from('documentos_processados').insert([{
      nome_arquivo: nome,
      tipo_doc: detectado.tipo,
      dados_extraidos: detectado.dados
    }]);

    setLogs(prev => [`${detectado.tipo}: ${nome}`, ...prev]);
    atualizarDashboard();
  };

  if (!isClient) return null; // Previne erro #418

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-900 p-6 rounded-2xl border-l-4 border-green-500 shadow-lg">
          <p className="text-zinc-500 text-xs font-bold uppercase">Veículos Cadastrados</p>
          <h2 className="text-4xl font-black mt-1">{stats.frota}</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg">
          <p className="text-zinc-500 text-xs font-bold uppercase">Documentos Processados</p>
          <h2 className="text-4xl font-black mt-1">{stats.docs}</h2>
        </div>
      </div>

      {/* ÁREA DE ARRASTE E COLE UNIVERSAL */}
      <div 
        onDrop={(e) => { e.preventDefault(); processarArquivos(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-20 rounded-[40px] text-center hover:border-green-600 transition-all cursor-pointer"
      >
        <UploadCloud className="mx-auto text-green-500 mb-4" size={56} />
        <h2 className="text-2xl font-black italic">MOTOR DE AUDITORIA PhD</h2>
        <p className="text-zinc-500">Arraste aqui seus Ofícios, CRLVs e Notas Fiscais</p>
      </div>

      {/* LOG DE PROCESSAMENTO */}
      <div className="mt-10">
        <h3 className="text-zinc-500 text-xs font-black mb-4 flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" /> FLUXO DE DADOS ATIVO
        </h3>
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between">
              <span className="text-sm font-mono text-zinc-300">{log}</span>
              <CheckCircle size={18} className="text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
