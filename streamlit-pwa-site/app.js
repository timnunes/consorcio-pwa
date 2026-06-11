// Apply Config
document.addEventListener('DOMContentLoaded', () => {
    document.title = CONFIG.appName;
    document.getElementById('apple-title').content = CONFIG.appName;
    document.getElementById('theme-color').content = CONFIG.themeColor;

    document.getElementById('favicon').href = CONFIG.appIcon;
    document.getElementById('apple-icon').href = CONFIG.appIcon;

    const iframe = document.getElementById('main-iframe');
    iframe.src = CONFIG.iframeUrl;

    document.body.style.backgroundColor = CONFIG.backgroundColor;
    document.getElementById('offline-overlay').style.backgroundColor = CONFIG.backgroundColor;

    updateOnlineStatus();
});

// Service Worker Registration com detecção de atualização
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').then(function (registration) {
            console.log('ServiceWorker registrado com escopo: ', registration.scope);

            // Verifica se já tem um SW novo esperando
            if (registration.waiting) {
                showUpdateBanner();
            }

            // Detecta quando um novo SW termina de instalar
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner();
                    }
                });
            });

        }, function (err) {
            console.log('ServiceWorker falhou: ', err);
        });

        // Recebe mensagem do SW avisando que atualizou
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showUpdateBanner();
            }
        });

        // Reload só acontece após o usuário clicar em Atualizar
        // NÃO colocar window.location.reload() aqui no controllerchange
    });
}

// Mostra banner fixo de atualização no topo
function showUpdateBanner() {
    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #1565c0;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
        <span>🔄 Nova versão disponível</span>
        <button onclick="applyUpdate()" style="
            background: white;
            color: #1565c0;
            border: none;
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
        ">Atualizar</button>
    `;
    document.body.prepend(banner);
}

// Aplica atualização ao clicar no botão
function applyUpdate() {
    navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
            // Quando o SW novo assumir, recarrega
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    });
}

// Online/Offline Handler
function updateOnlineStatus() {
    const overlay = document.getElementById('offline-overlay');
    if (navigator.onLine) {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'flex';
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
