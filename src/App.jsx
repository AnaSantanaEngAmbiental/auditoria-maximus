<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiLAM-PA Maximus v5.1 | Auditoria Integrada Ph.D.</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        .phd-gradient { background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #14532d 100%); }
        .page { display: none; }
        .page.active { display: block; animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-item.active { background: #14532d; color: white; border-right: 4px solid #4ade80; }
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; }
        .atende { background: #dcfce7; color: #166534; }
        .pendente { background: #fee2e2; color: #991b1b; }
        .alerta { background: #fef3c7; color: #92400e; }
        .critico { background: #450a0a; color: #fecaca; }
        
        @media print { 
            .no-print { display: none !important; } 
            #relatorio { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">

    <nav class="phd-gradient text-white sticky top-0 z-50 shadow-2xl px-6 h-16 flex justify-between items-center no-print">
        <div class="flex items-center space-x-3">
            <div class="bg-white p-1.5 rounded-lg text-green-900 shadow-inner"><i data-lucide="shield-check" class="w-6 h-6"></i></div>
            <div>
                <h1 class="text-sm font-black tracking-tighter uppercase leading-none text-green-400">SiLAM-PA MAXIMUS v5.1</h1>
                <p class="text-[9px] font-bold opacity-70 uppercase tracking-widest">Inteligência de Prazos Integrada</p>
            </div>
        </div>
        <div class="flex items-center space-x-4">
            <button onclick="gerarRelatorio()" class="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition">Gerar Relatório Ambiental</button>
            <button onclick="window.print()" class="bg-white text-green-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Exportar Dossiê PDF</button>
        </div>
    </nav>

    <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-white border-r shadow-xl flex flex-col z-40 no-print">
            <div class="p-6 space-y-2">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Módulos de Auditoria</p>
                <button onclick="showP('upload')" class="sidebar-item active w-full flex items-center p-3 text-[11px] font-black rounded-xl transition" data-id="upload"><i data-lucide="layout-grid" class="w-4 h-4 mr-3 text-green-600"></i> CENTRAL DE DADOS</button>
                <button onclick="showP('frota')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-black rounded-xl transition" data-id="frota"><i data-lucide="truck" class="w-4 h-4 mr-3 text-blue-600"></i> AUDITORIA DE FROTA (14)</button>
                <div class="h-px bg-slate-100 my-4"></div>
                <button onclick="showP('basica')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-bold rounded-xl transition" data-id="basica"><i data-lucide="file-check" class="w-4 h-4 mr-3"></i> 1. DOC. BÁSICA</button>
                <button onclick="showP('tecnica')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-bold rounded-xl transition" data-id="tecnica"><i data-lucide="cpu" class="w-4 h-4 mr-3"></i> 2. DOC. TÉCNICA</button>
                <button onclick="showP('diretrizes')" class="sidebar-item w-full flex items-center p-3 text-[11px] font-bold rounded-xl transition" data-id="diretrizes"><i data-lucide="list-checks" class="w-4 h-4 mr-3"></i> 4. DIRETRIZES</button>
            </div>
            <div class="mt-auto p-6 bg-slate-50 border-t">
                <div class="flex items-center space-x-2 text-green-800">
                    <i data-lucide="database" class="w-4 h-4"></i>
                    <span class="text-[10px] font-black uppercase tracking-tighter">Motor Maximus Ativo</span>
                </div>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto p-8 bg-[#f9fafb]">
            
            <div id="upload" class="page active space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-green-500 transition cursor-pointer group" onclick="document.getElementById('fileIn').click()">
                        <input type="file" id="fileIn" multiple class="hidden" onchange="processarIn(this.files)">
                        <div class="flex flex-col items-center">
                            <div class="bg-green-50 p-6 rounded-3xl text-green-600 mb-6 group-hover:scale-110 transition"><i data-lucide="file-up" class="w-12 h-12"></i></div>
                            <h3 class="font-black uppercase text-sm">Carregar Evidências</h3>
                            <p class="text-[10px] text-slate-400 font-bold mt-2">Dossiê Caeli Transportes</p>
                        </div>
                    </div>
                    <div class="bg-slate-900 p-6 rounded-3xl shadow-2xl overflow-hidden">
                         <h4 class="text-green-400 text-[10px] font-black uppercase mb-4 flex items-center"><i data-lucide="terminal" class="w-3 h-3 mr-2"></i> Log de Inteligência</h4>
                         <div id="logCons" class="font-mono text-[9px] text-green-500 h-40 overflow-y-auto space-y-1">
                            > SISTEMA PRONTO PARA AUDITORIA DE PRAZOS.
                         </div>
                    </div>
                </div>
                <div id="fileGrid" class="grid grid-cols-4 gap-4"></div>
            </div>

            <div id="frota" class="page space-y-6">
                <div class="bg-white p-8 rounded-3xl shadow-sm border">
                    <h2 class="font-black uppercase text-xl border-l-8 border-blue-600 pl-4 mb-8">Gestão de Vencimentos de Frota (14)</h2>
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b">
                            <tr class="text-[10px] font-black uppercase text-slate-400">
                                <th class="p-4">Placa</th>
                                <th class="p-4">CIV / CIPP</th>
                                <th class="p-4">MOPP (Condutor)</th>
                                <th class="p-4">Status ANTT</th>
                                <th class="p-4 text-center">Risco</th>
                            </tr>
                        </thead>
                        <tbody id="frotaBody" class="divide-y"></tbody>
                    </table>
                </div>
            </div>

            <div id="basica" class="page bg-white rounded-3xl shadow-sm overflow-hidden"><table class="w-full" id="tabBasica"></table></div>
            <div id="tecnica" class="page bg-white rounded-3xl shadow-sm overflow-hidden"><table class="w-full" id="tabTecnica"></table></div>
            <div id="diretrizes" class="page bg-white rounded-3xl shadow-sm overflow-hidden"><table class="w-full" id="tabDiretrizes"></table></div>

            <div id="relatorio" class="page bg-white p-12 rounded-[2rem] shadow-2xl max-w-5xl mx-auto border text-black">
                <div class="flex justify-between items-center border-b-8 border-green-900 pb-6 mb-8">
                    <h2 class="text-2xl font-black uppercase leading-none">Relatório de Conformidade Integrado</h2>
                    <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase">Gerado:</p><p id="dtRel" class="text-sm font-black"></p></div>
                </div>
                <div id="relStats" class="grid grid-cols-3 gap-6 mb-8"></div>
                <div id="relCorpo" class="space-y-4"></div>
            </div>

        </main>
    </div>

    <script>
        const docs = [];
        const hoje = new Date();

        // Dados da Frota com Datas para cálculo
        const frotaDB = [
            {placa: "JWD-4A12", mot: "Carlos A.", mopp: "2026-12-30", civ: "2026-06-15", antt: "ATIVO"},
            {placa: "OTZ-9088", mot: "Ricardo S.", mopp: "2025-01-20", civ: "2024-12-01", antt: "INATIVO"},
            {placa: "QDA-2211", mot: "Marcos P.", mopp: "2025-05-15", civ: "2025-01-05", antt: "ATIVO"},
            {placa: "NSW-8877", mot: "João F.", mopp: "2025-01-10", civ: "2025-01-02", antt: "BLOQUEADO"}
        ];

        const dbBasica = ["Requerimento Padrão", "Ficha Cadastral", "CNPJ", "Alvará de Funcionamento", "Bombeiros", "Licença Ambiental Anterior"];
        const dbTecnica = ["Análise de Água", "Laudo de Efluentes", "CIV Inmetro", "CIPP Tanque", "MOPP"];

        function init() {
            lucide.createIcons();
            renderFrota();
            renderTab("tabBasica", dbBasica, "B");
            renderTab("tabTecnica", dbTecnica, "T");
        }

        function showP(id) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            const btn = document.querySelector(`[data-id="${id}"]`);
            if(btn) btn.classList.add('active');
        }

        function calcularRisco(dataStr) {
            const dataVenc = new Date(dataStr);
            const diffDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
            
            if (diffDias < 0) return { label: "VENCIDO", cls: "critico", icone: "alert-octagon" };
            if (diffDias <= 30) return { label: "ALERTA", cls: "alerta", icone: "alert-triangle" };
            return { label: "OK", cls: "atende", icone: "check-circle" };
        }

        function processarIn(files) {
            for(let f of files) {
                const n = f.name.toUpperCase();
                docs.push(n);
                const l = document.createElement('div');
                l.textContent = `> AUDITANDO: ${n}... CONFORMIDADE VERIFICADA.`;
                document.getElementById('logCons').prepend(l);
            }
            renderFrota();
            renderTab("tabBasica", dbBasica, "B");
            renderTab("tabTecnica", dbTecnica, "T");
        }

        function renderFrota() {
            const b = document.getElementById('frotaBody');
            b.innerHTML = frotaDB.map(v => {
                const rMopp = calcularRisco(v.mopp);
                const rCiv = calcularRisco(v.civ);
                const riscoGeral = (rMopp.label === 'VENCIDO' || rCiv.label === 'VENCIDO' || v.antt !== 'ATIVO') ? 'critico' : 'atende';

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-4 font-black text-blue-900">${v.placa}</td>
                        <td class="p-4">
                            <span class="status-badge ${rCiv.cls}">${v.civ}</span>
                        </td>
                        <td class="p-4 font-bold">
                            <span class="status-badge ${rMopp.cls}">${v.mopp}</span>
                        </td>
                        <td class="p-4"><span class="status-badge ${v.antt === 'ATIVO' ? 'atende' : 'pendente'}">${v.antt}</span></td>
                        <td class="p-4 text-center">
                            <div class="inline-flex items-center justify-center p-2 rounded-full ${riscoGeral === 'critico' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">
                                <i data-lucide="${riscoGeral === 'critico' ? 'shield-x' : 'shield-check'}" class="w-4 h-4"></i>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        function renderTab(id, lista, prefix) {
            const table = document.getElementById(id);
            table.innerHTML = `
                <thead class="bg-slate-50 border-b">
                    <tr class="text-[9px] font-black uppercase text-slate-400">
                        <th class="p-4 w-20">REF</th>
                        <th class="p-4">REQUISITO</th>
                        <th class="p-4">STATUS</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${lista.map((d, i) => {
                        const match = docs.some(f => f.includes(d.toUpperCase().split(' ')[0]));
                        return `
                        <tr>
                            <td class="p-4 text-[10px] font-bold text-slate-400">${prefix}${i+1}</td>
                            <td class="p-4 text-[11px] font-black uppercase text-slate-800">${d}</td>
                            <td class="p-4"><span class="status-badge ${match ? 'atende' : 'pendente'}">${match ? 'CONFORME' : 'NÃO IDENTIFICADO'}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            `;
        }

        function gerarRelatorio() {
            document.getElementById('dtRel').textContent = hoje.toLocaleDateString();
            const bAtende = dbBasica.filter(d => docs.some(f => f.includes(d.toUpperCase().split(' ')[0]))).length;
            const tAtende = dbTecnica.filter(d => docs.some(f => f.includes(d.toUpperCase().split(' ')[0]))).length;
            
            document.getElementById('relStats').innerHTML = `
                <div class="bg-slate-100 p-4 rounded-xl font-black text-center">TOTAL DOCS: ${dbBasica.length + dbTecnica.length}</div>
                <div class="bg-green-100 p-4 rounded-xl font-black text-center text-green-700 text-2xl">${bAtende + tAtende}</div>
                <div class="bg-red-100 p-4 rounded-xl font-black text-center text-red-700">FALTAM: ${(dbBasica.length + dbTecnica.length) - (bAtende + tAtende)}</div>
            `;
            
            showP('relatorio');
        }

        window.onload = init;
    </script>
</body>
</html>
