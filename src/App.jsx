import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { Share2, AlertTriangle, CheckCircle, Calendar, Upload } from 'lucide-react';

const supabase = createClient('SUA_URL', 'SUA_KEY');

export default function MaximusSistemaCompleto() {
  const [frota, setFrota] = useState([]);
  const [vencendoMes, setVencendoMes] = useState(0);
  const [irregularidades, setIrregularidades] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. DASHBOARD: BUSCA VENCIMENTOS DO MÊS
  const carregarDashboard = async () => {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

    const { data, count } = await supabase
      .from('frota_veiculos')
      .select('*', { count: 'exact' })
      .gte('vencimento_rntrc', inicioMes)
      .lte('vencimento_rntrc', fimMes);

    setVencendoMes(count || 0);
    setFrota(data || []);
  };

  useEffect(() => { carregarDashboard(); }, []);

  // 2. COMPARADOR ANTT (OCR + BANCO)
  const processarComparacao = async (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let textoTotal = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        textoTotal += content.items.map(s => s.str).join(" ");
      }

      const placasNoPDF = textoTotal.match(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g) || [];
      const { data: frotaCadastrada } = await supabase.from('frota_veiculos').select('placa');
      
      const faltantes = frotaCadastrada
        .map(v => v.placa)
        .filter(p => !placasNoPDF.includes(p));

      setIrregularidades(faltantes);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. WHATSAPP: NOTIFICAÇÃO PROFISSIONAL
  const enviarZap = (placa) => {
    const msg = `🚨 *Maximus PhD Informa:*%0A%0AVeículo placa *${placa}* não identificado no extrato ANTT.%0AFavor verificar regularidade imediatamente.`;
    window.open(`https://wa.me/55NUMERO?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-black text-white min-h-screen p-8">
      {/* SEÇÃO CARDS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 p-6 rounded-xl border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <Calendar className="text-green-500" />
            <span className="text-3xl font-bold">{vencendoMes}</span>
          </div>
          <p className="mt-2 text-zinc-400">RNTRC Vencendo este Mês</p>
        </div>
      </div>

      {/* SEÇÃO COMPARADOR ANTT */}
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 mb-8 text-center">
        <Upload className="mx-auto mb-4 text-green-500" size={40} />
        <h2 className="text-xl font-bold mb-2">Arraste o Extrato ANTT (.pdf)</h2>
        <input type="file" onChange={(e) => processarComparacao(e.target.files[0])} className="hidden" id="pdfInput" />
        <label htmlFor="pdfInput" className="bg-green-600 px-6 py-2 rounded-lg cursor-pointer hover:bg-green-500">
          {loading ? "Processando..." : "Selecionar Arquivo"}
        </label>
      </div>

      {/* RESULTADO DA VARREDURA */}
      {irregularidades.length > 0 && (
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-red-900/50">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-4">Placa</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {irregularidades.map(placa => (
                <tr key={placa} className="border-t border-zinc-800">
                  <td className="p-4 font-mono font-bold">{placa}</td>
                  <td className="p-4 text-red-500 flex items-center gap-2">
                    <AlertTriangle size={16} /> NÃO CONSTA NO EXTRATO
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => enviarZap(placa)} className="bg-green-600 p-2 rounded-md hover:bg-green-500">
                      <Share2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
