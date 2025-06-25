document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos DOM principais
    const toggleSidebarButton = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenu = document.getElementById('userMenu');
    const contentArea = document.getElementById('contentArea'); // Área onde o conteúdo dinâmico será injetado
    const pageTitle = document.getElementById('pageTitle');     // Título no cabeçalho que será atualizado
    const navLinks = document.querySelectorAll('.sidebar nav a'); // Todos os links de navegação na sidebar

    // Variáveis globais para instâncias de gráficos e scanners QR, para poderem ser destruídas/paradas
    let maintenanceChartInstance = null;
    let equipmentBySectorChartInstance = null;
    let maintenanceStatusChartInstance = null;
    let topEquipmentsOSChartInstance = null;
    let html5QrCodeScanner = null; // Instância do scanner QR

    // Variável global para armazenar a função de inicialização da página atual, para limpeza.
    let currentPageInitializer = null;

    // --- Funcionalidade da Barra Lateral (Sidebar) ---
    if (toggleSidebarButton && sidebar) {
        // Estado inicial: 'collapsed' (escondida) em mobile, 'não-collapsed' (expandida) em desktop
        if (window.innerWidth < 768) {
            sidebar.classList.add('collapsed'); // Inicia escondida em mobile
        } else {
            sidebar.classList.remove('collapsed'); // Inicia expandida em desktop
        }

        toggleSidebarButton.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed'); // Alterna o estado colapsado/expandido
            // Alterna a classe 'sidebar-open' no body para controlar o overlay em mobile
            if (window.innerWidth < 768) {
                document.body.classList.toggle('sidebar-open');
            }
        });

        // Ajusta a sidebar ao redimensionar a janela (para mobile vs. desktop)
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) { // Se for desktop
                sidebar.classList.remove('collapsed'); // Garante que esteja expandida
                document.body.classList.remove('sidebar-open'); // Remove overlay se presente
            } else { // Se for mobile
                sidebar.classList.add('collapsed'); // Garante que esteja escondida
                document.body.classList.remove('sidebar-open'); // Remove overlay se presente
            }
        });
    }

    // --- Funcionalidade do Menu do Usuário ---
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function() {
            userMenu.classList.toggle('hidden');
        });

        // Fechar o menu se clicar fora dele
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }

    // --- Funções para Gráficos (Recebe dados reais do backend) ---
    window.initializeCharts = function(dashboardMetrics) { // Esta já é global
        // Verifica se a biblioteca Chart.js foi carregada
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não está carregado. Os gráficos não serão inicializados.');
            return;
        }

        // Destroi instâncias antigas de gráficos para evitar duplicação e erros
        if (maintenanceChartInstance) maintenanceChartInstance.destroy();
        if (equipmentBySectorChartInstance) equipmentBySectorChartInstance.destroy();
        if (maintenanceStatusChartInstance) maintenanceStatusChartInstance.destroy();
        if (topEquipmentsOSChartInstance) topEquipmentsOSChartInstance.destroy();

        // Gráfico 1: Manutenções por Tipo e Mês
        const maintenanceChartCanvas = document.getElementById('maintenanceChart');
        if (maintenanceChartCanvas && dashboardMetrics.manutencoesPorMes) {
            const labels = dashboardMetrics.manutencoesPorMes.map(m => m.mes_ano);
            const preventivaData = dashboardMetrics.manutencoesPorMes.map(m => m.preventiva_count);
            const corretivaData = dashboardMetrics.manutencoesPorMes.map(m => m.corretiva_count);

            maintenanceChartInstance = new Chart(maintenanceChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Manutenção Preventiva',
                            data: preventivaData,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Manutenção Corretiva',
                            data: corretivaData,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Gráfico 2: Equipamentos por Setor (Adaptado do antigo "Equipamentos por Tipo")
        const equipmentBySectorChartCanvas = document.getElementById('equipmentBySectorChart');
        if (equipmentBySectorChartCanvas && dashboardMetrics.equipamentosPorSetor) {
            const labels = dashboardMetrics.equipamentosPorSetor.map(s => s.setor || 'Não Definido');
            const data = dashboardMetrics.equipamentosPorSetor.map(s => s.count);

            equipmentBySectorChartInstance = new Chart(equipmentBySectorChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de Equipamentos',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(114, 250, 102, 0.6)',
                            'rgba(70, 192, 192, 0.6)'
                        ],
                        borderColor: [
                            'rgba(255, 206, 86, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(114, 250, 102, 1)',
                            'rgba(70, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }

        // Gráfico 3: Manutenções por Status (Pizza)
        const maintenanceStatusChartCanvas = document.getElementById('maintenanceStatusChart');
        if (maintenanceStatusChartCanvas && dashboardMetrics.manutencoesPorStatus) {
            const labels = dashboardMetrics.manutencoesPorStatus.map(s => s.status);
            const data = dashboardMetrics.manutencoesPorStatus.map(s => s.count);
            
            maintenanceStatusChartInstance = new Chart(maintenanceStatusChartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Manutenções',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 205, 86, 0.6)', // Pendente (amarelo)
                            'rgba(54, 162, 235, 0.6)', // Em Andamento (azul)
                            'rgba(75, 192, 192, 0.6)', // Concluída (verde)
                            'rgba(255, 99, 132, 0.6)'  // Cancelada (vermelho)
                        ],
                        borderColor: [
                            'rgba(255, 205, 86, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }

        // Gráfico 4: Top 5 Equipamentos com Mais Ordens de Serviço (Barra Horizontal)
        const topEquipmentsOSChartCanvas = document.getElementById('topEquipmentsOSChart');
        if (topEquipmentsOSChartCanvas && dashboardMetrics.topEquipamentosOS) {
            const labels = dashboardMetrics.topEquipamentosOS.map(e => e.equipamento_nome);
            const data = dashboardMetrics.topEquipamentosOS.map(e => e.os_count);

            topEquipmentsOSChartInstance = new Chart(topEquipmentsOSChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de OS',
                        data: data,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Barras horizontais
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // --- Funções para Carregar/Remover Scripts Externos Dinamicamente ---
    function loadScript(url, callback) {
        if (document.querySelector(`script[src="${url}"]`)) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = () => console.error(`Falha ao carregar script: ${url}`);
        document.head.appendChild(script);
    }

    function unloadScript(url) {
        const scripts = document.querySelectorAll(`script[src="${url}"]`);
        scripts.forEach(script => script.remove());
    }

    // --- Lógica de Carregamento de Conteúdo Dinâmico (SPA) ---
    window.loadContent = async function(pageName, filter = null) { // Adicionado 'window.'
        try {
            // 1. Limpeza de scripts e estados anteriores
            if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                await html5QrCodeScanner.stop().catch(err => console.warn("Erro ao parar scanner QR:", err));
                html5QrCodeScanner = null;
            }
            // Destroi instâncias de gráficos se existirem
            if (maintenanceChartInstance) { maintenanceChartInstance.destroy(); maintenanceChartInstance = null; }
            if (equipmentBySectorChartInstance) { equipmentBySectorChartInstance.destroy(); equipmentBySectorChartInstance = null; }
            if (maintenanceStatusChartInstance) { maintenanceStatusChartInstance.destroy(); maintenanceStatusChartInstance = null; }
            if (topEquipmentsOSChartInstance) { topEquipmentsOSChartInstance.destroy(); topEquipmentsOSChartInstance = null; }

            // Limpa as referências das funções de inicialização da página anterior
            window.initializeEquipamentosPage = undefined;
            window.initializeDashboardPage = undefined;
            window.initializeQrCodePage = undefined;
            window.initializeAbrirChamadoPage = undefined;
            window.initializeConfiguracoesPage = undefined;
            window.initializeOrdensServicoPage = undefined;
            window.initializeRelatoriosPage = undefined;
            window.initializeTecnicosPage = undefined;

            // 2. Faz a requisição para o ficheiro HTML parcial da página
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const htmlContent = await response.text();

            // Usa DOMParser para analisar o HTML carregado de forma segura
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // 3. Atualiza o título da página no cabeçalho. Usa h2 porque a maioria das suas páginas tem h2.
            const newPageTitle = doc.querySelector('h2')?.textContent || capitalizeFirstLetter(pageName);
            pageTitle.textContent = newPageTitle;

            // 4. Injeta o conteúdo HTML na área principal (limpa antes)
            contentArea.innerHTML = '';
            Array.from(doc.body.children).forEach(child => {
                contentArea.appendChild(child.cloneNode(true));
            });

            // 5. Gerenciamento de Scripts Específicos da Página
            unloadScript('https://cdn.jsdelivr.net/npm/chart.js');
            unloadScript('https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js');

            const pageScripts = doc.querySelectorAll('script:not([src])');
            pageScripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                if (oldScript.dataset) {
                    for (const key in oldScript.dataset) {
                        newScript.dataset[key] = oldScript.dataset[key];
                    }
                }
                document.body.appendChild(newScript);
            });

            // Carrega e inicializa scripts ou chama funções de inicialização específicas para cada página
            if (pageName === 'dashboard') {
                loadScript('https://cdn.jsdelivr.net/npm/chart.js', () => {
                    if (typeof window.initializeDashboardPage === 'function') {
                        currentPageInitializer = window.initializeDashboardPage;
                        window.initializeDashboardPage(); 
                    } else {
                        console.error('Função initializeDashboardPage não encontrada para o Dashboard. Verifique o script em dashboard.html.');
                    }
                });
            } else if (pageName === 'equipamentos') {
                if (typeof window.initializeEquipamentosPage === 'function') {
                    currentPageInitializer = window.initializeEquipamentosPage;
                    window.initializeEquipamentosPage();
                } else {
                    console.error('Função initializeEquipamentosPage não encontrada para a página de equipamentos. Verifique o script em equipamentos.html.');
                }
            } else if (pageName === 'verificar-qrcode') {
                loadScript('https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js', () => {
                    if (typeof window.initializeQrCodePage === 'function') {
                        currentPageInitializer = window.initializeQrCodePage;
                        window.initializeQrCodePage();
                    } else {
                        console.warn('Função initializeQrCodePage não encontrada. Usando fallback de inicialização direta para QR.');
                        if (typeof Html5Qrcode !== 'undefined' && pageTitle.textContent.includes('QR Code')) {
                             html5QrCodeScanner = new Html5Qrcode("reader");
                        }
                    }
                });
            
            } else if (pageName === 'configuracoes') {
                if (typeof window.initializeConfiguracoesPage === 'function') {
                    currentPageInitializer = window.initializeConfiguracoesPage;
                    window.initializeConfiguracoesPage();
                } else {
                    console.error('Função initializeConfiguracoesPage não encontrada para a página de configurações. Verifique o script em configuracoes.html.');
                }
            } else if (pageName === 'ordens-servico') {
                if (typeof window.initializeOrdensServicoPage === 'function') {
                    currentPageInitializer = window.initializeOrdensServicoPage;
                    window.initializeOrdensServicoPage(filter); 
                } else {
                    console.error('Função initializeOrdensServicoPage não encontrada para a página de ordens de serviço. Verifique o script em ordens-servico.html.');
                }
            } else if (pageName === 'relatorios') {
                if (typeof window.initializeRelatoriosPage === 'function') {
                    currentPageInitializer = window.initializeRelatoriosPage;
                    window.initializeRelatoriosPage();
                } else {
                    console.error('Função initializeRelatoriosPage não encontrada para a página de relatórios. Verifique o script em relatorios.html.');
                }
            } else if (pageName === 'tecnicos') {
                if (typeof window.initializeTecnicosPage === 'function') {
                    currentPageInitializer = window.initializeTecnicosPage;
                    window.initializeTecnicosPage();
                } else {
                    console.error('Função initializeTecnicosPage não encontrada para a página de técnicos. Verifique o script em tecnicos.html.');
                }
            }

            // 6. Gerenciamento da Classe 'active-nav-link'
            navLinks.forEach(link => link.classList.remove('active-nav-link'));
            const activeLink = document.querySelector(`.sidebar nav a[data-page="${pageName}"]`);
            if (activeLink) {
                activeLink.classList.add('active-nav-link');
            }

            // 7. Atualização do Histórico do Navegador (incluindo o filtro)
            const newUrl = `?page=${pageName}${filter ? '&status=' + filter : ''}`;
            history.pushState({ page: pageName, filter: filter }, '', newUrl);

        } catch (error) {
            console.error('Erro ao carregar o conteúdo da página:', error);
            contentArea.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Erro!</strong>
                <span class="block sm-inline">Não foi possível carregar o conteúdo da página. Por favor, tente novamente.</span>
            </div>`;
        }
    }

    // Função auxiliar para capitalizar a primeira letra de uma string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).replace(/-/g, ' ');
    }

    // --- Event Listeners para os links da Sidebar ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = this.dataset.page;
            if (page) {
                loadContent(page);
            }
        });
    });

    // --- Lidar com a navegação do navegador (botões Voltar/Avançar) ---
    window.addEventListener('popstate', function(event) {
        const filterFromState = event.state ? event.state.filter : null;
        if (event.state && event.state.page) {
            loadContent(event.state.page, filterFromState);
        } else {
            loadContent('dashboard');
        }
    });

    // --- Carrega o Dashboard por padrão quando a página é carregada pela primeira vez ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = urlParams.get('page') || 'dashboard';
    const initialFilter = urlParams.get('status') || null;
    loadContent(initialPage, initialFilter);
});