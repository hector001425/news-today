if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

let deferredPrompt = null;
const btn = document.getElementById('install-btn');

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

if (btn && !isStandalone()) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    btn.hidden = false;
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    btn.hidden = true;
  });
}
