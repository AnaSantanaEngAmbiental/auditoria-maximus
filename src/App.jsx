<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiLAM-PA Maximus v5.1 | Auditoria Ph.D. Caeli</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        /* CSS ORIGINAL PRESERVADO V5.0 */
        .phd-gradient { background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #14532d 100%); }
        .page { display: none; }
        .page.active { display: block; animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-item.active { background: #14532d; color: white; border-right: 4px solid #4ade80; }
        .status-badge { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .atende { background: #dcfce7; color: #166534; border: 1px solid #166534; }
        .pendente { background: #fee2e2; color: #991b1b; border: 1px solid #991b1b; }
        .alerta { background: #fef3c7; color: #92400e; border: 1px solid #92400e; }
        .critico { background: #450a0a; color: #ffffff; border: 1px solid #ff0000; }
        
        @media print { .no-print { display: none !important; } .page { display: block !important; } }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">

    <nav class="phd-gradient text-white sticky top-0 z-50 shadow-2xl px-6 h-16 flex justify-between items-center no-print">
        <div class="flex items-center space-x-3">
            <div class="bg-white p-1.5 rounded-lg text-green-900 shadow-inner"><i data-lucide="shield-check" class="w-6 h-6"></i></div>
            <div>
                <h1 class="text-sm font-black tracking-tighter uppercase leading-none text-green-400">SiLAM-PA MAXIMUS v5.1</h1>
                <p class="text-[9px] font-bold opacity-70 uppercase tracking-widest text-white">Gestão Ph.D. Caeli Transportes</p>
            </div>
        </div>
        <div class="flex items-center space-x-4">
            <button onclick="gerarRelatorio()" class="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition">Gerar Relatório</button>
            <button onclick="window.print()" class="bg-white text-green-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Exportar Dossiê</button>
        </div>
    </nav>

    <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-white border-r shadow-xl flex flex-col z-40 no-print">
            <div class="p-6 space-y-2">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Módulos</p>
                <button onclick="showP('upload')" class="sidebar-item active w-full flex items-center p-3 text-[11px] font-black rounded-xl transition" data-id="upload"><i data-lucide="layout-grid" class="w-4 h-4 mr-3 text-green-600"></i> CENTRAL DE DADOS</button>
                <button onclick="showP('frota')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-black rounded-xl transition" data-id="frota"><i data-lucide="truck" class="w-4 h-4 mr-3 text-blue-600"></i> AUDITORIA DE FROTA (14)</button>
                <div class="h-px bg-slate-100 my-4"></div>
                <button onclick="showP('basica')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-bold rounded-xl transition" data-id="basica"><i data-lucide="file-check" class="w-4 h-4 mr-3"></i> 1. DOC. BÁSICA</button>
                <button onclick="showP('tecnica')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-bold rounded-xl transition" data-id="tecnica"><i data-lucide="cpu" class="w-4 h-4 mr-3"></i> 2. DOC. TÉCNICA</button>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto p-8 bg-[#f9fafb]">
            
            <div id="upload" class="page active space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-green-500 transition cursor-pointer group" onclick="document.getElementById('fileIn').click()">
                        <input type="file" id="fileIn" multiple class="hidden" onchange="processarArquivos(this.files)">
                        <div class="flex flex-col items-center">
                            <div class="bg-green-50 p-6 rounded-3xl text-green-600 mb-6 group-hover:scale-110 transition"><i data-lucide="file-up" class="w-12 h-12"></i></div>
                            <h3 class="font-black uppercase text-sm">Arraste as Evidências</h3>
                            <p class="text-[10px] text-slate-400 font-bold mt-2">O SISTEMA VINCULARÁ AUTOMATICAMENTE PELA PLACA</p>
                        </div>
                    </div>
                    <div class="bg-slate-900 p-6 rounded-3xl shadow-2xl">
                         <h4 class="text-green-400 text-[10px] font-black uppercase mb-4 flex items-center"><i data-lucide="terminal" class="w-3 h-3 mr-2"></i> Console Maximus v5.1</h4>
                         <div id="logConsole" class="font-mono text-[9px] text-green-500 h-40 overflow-y-auto space-y-1">
                            > AGUARDANDO DOCUMENTOS PARA ANÁLISE...
                         </div>
                    </div>
                </div>
            </div>

            <div id="frota" class="page space-y-6">
                <div class="bg-white p-8 rounded-3xl shadow-sm border">
                    <h2 class="font-black uppercase text-xl border-l-8 border-blue-600 pl-4 mb-8">Auditoria Técnica de Frota (14 Unidades)</h2>
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b">
                            <tr class="text-[10px] font-black uppercase text-slate-400">
                                <th class="p-4">Veículo/Placa</th>
                                <th class="p-4">Validade CIV</th>
                                <th class="p-4">Validade CIPP</th>
                                <th class="p-4">Status ANTT</th>
                                <th class="p-4">Evidência PDF</th>
                                <th class="p-4 text-center">Situação</th>
                            </tr>
                        </thead>
                        <tbody id="frotaBody" class="divide-y"></tbody>
                    </table>
                </div>
            </div>

            <div id="basica" class="page bg-white rounded-3xl shadow-sm overflow-hidden"><table class="w-full" id="tabBasica"></table></div>
            <div id="tecnica" class="page bg-white rounded-3xl shadow-sm overflow-hidden"><table class="w-full" id="tabTecnica"></table></div>

        </main>
    </div>

    <script>
        let arquivosSubidos = [];
        const hoje = new Date(); // Data base 2026 conforme sistema

        // FONTE DA VERDADE: OS 14 VEÍCULOS CAELI
        const frotaTotal = [
            {placa: "JWD4A12", mot: "Carlos A.", mopp: "2026-12-30", civ: "2026-06-15", cipp: "2026-06-15", antt: "ATIVO"},
            {placa: "OTZ9088", mot: "Ricardo S.", mopp: "2025-01-20", civ: "2025-02-10", cipp: "2025-02-10", antt: "INATIVO"},
            {placa: "QDA2211", mot: "Marcos P.", mopp: "2025-05-15", civ: "2026-01-05", cipp: "2026-01-05", antt: "ATIVO"},
            {placa: "NSW8877", mot: "João F.", mopp: "2025-01-10", civ: "2025-01-02", cipp: "2025-01-02", antt: "BLOQUEADO"},
            {placa: "OBU4433", mot: "Luis O.", mopp: "2027-10-10", civ: "2027-10-10", cipp: "2027-10-10", antt: "ATIVO"},
            {placa: "RXX0099", mot: "Pedro A.", mopp: "2026-02-20", civ: "2026-02-20", cipp: "2026-02-20", antt: "ATIVO"},
            {placa: "QVR1234", mot: "Samuel R.", mopp: "2024-12-01", civ: "2026-01-01", cipp: "2026-01-01", antt: "ATIVO"},
            {placa: "JUD7766", mot: "Tiago M.", mopp: "2025-11-11", civ: "2025-11-11", cipp: "2025-11-11", antt: "ATIVO"},
            {placa: "OTY5544", mot: "Bruno D.", mopp: "2026-01-05", civ: "2025-12-20", cipp: "2025-12-20", antt: "ATIVO"},
            {placa: "PZS3322", mot: "Fabio J.", mopp: "2025-08-30", civ: "2025-08-30", cipp: "2025-08-30", antt: "ATIVO"},
            {placa: "MXT1199", mot: "Diego C.", mopp: "2026-04-14", civ: "2026-04-14", cipp: "2026-04-14", antt: "ATIVO"},
            {placa: "KLS8800", mot: "Hugo L.", mopp: "2024-05-01", civ: "2026-01-01", cipp: "2026-01-01", antt: "INATIVO"},
            {placa: "PPA0011", mot: "Renato A.", mopp: "2026-12-22", civ: "2026-12-22", cipp: "2026-12-22", antt: "ATIVO"},
            {placa: "LOO2233", mot: "Arthur S.", mopp: "2027-09-09", civ: "2027-09-09", cipp: "2027-09-09", antt: "ATIVO"}
        ];

        function init() {
            lucide.createIcons();
            renderFrota();
        }

        function showP(id) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            const btn = document.querySelector(`[data-id="${id}"]`);
            if(btn) btn.classList.add('active');
        }

        // Lógica de Notificação e Risco
        function getStatusData(dataStr) {
            const dataVenc = new Date(dataStr);
            const diff = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
            if (diff < 0) return { label: "VENCIDO", cls: "critico" };
            if (diff <= 30) return { label: "RENOVAR", cls: "alerta" };
            return { label: "OK", cls: "atende" };
        }

        function processarArquivos(files) {
            for(let f of files) {
                const nome = f.name.toUpperCase();
                arquivosSubidos.push(nome);
                const l = document.createElement('p');
                l.textContent = `> DETECTADO: ${nome} - PROCESSANDO VINCULAÇÃO...`;
                document.getElementById('logConsole').prepend(l);
            }
            renderFrota();
        }

        function renderFrota() {
            const body = document.getElementById('frotaBody');
            body.innerHTML = frotaTotal.map(v => {
                const sCiv = getStatusData(v.civ);
                const sCipp = getStatusData(v.cipp);
                const temPDF = arquivosSubidos.some(arq => arq.includes(v.placa));
                
                let situacaoFinal = "OPERACIONAL";
                let situacaoCls = "atende";

                if (sCiv.label === "VENCIDO" || sCipp.label === "VENCIDO" || v.antt !== "ATIVO") {
                    situacaoFinal = "BLOQUEADO";
                    situacaoCls = "critico";
                } else if (sCiv.label === "RENOVAR" || sCipp.label === "RENOVAR") {
                    situacaoFinal = "ATENÇÃO";
                    situacaoCls = "alerta";
                }

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-4 font-black text-blue-900">${v.placa}<br><span class="text-[9px] text-slate-400">${v.mot}</span></td>
                        <td class="p-4"><span class="status-badge ${sCiv.cls}">${v.civ}</span></td>
                        <td class="p-4"><span class="status-badge ${sCipp.cls}">${v.cipp}</span></td>
                        <td class="p-4"><span class="status-badge ${v.antt === 'ATIVO' ? 'atende' : 'pendente'}">${v.antt}</span></td>
                        <td class="p-4 font-bold text-[10px]">${temPDF ? '✅ VINCULADO' : '❌ PENDENTE'}</td>
                        <td class="p-4 text-center"><span class="status-badge ${situacaoCls}">${situacaoFinal}</span></td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        window.onload = init;
    </script>
</body>
</html>
