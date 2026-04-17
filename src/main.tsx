import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard: não registrar Service Worker em iframes ou preview do Lovable
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// AUTO-HEAL: detecta Service Worker preso/desatualizado e força limpeza.
// Sintoma: login fica em "Carregando..." infinito no Chrome/Edge porque o SW
// antigo serve um bundle quebrado e impede a inicialização do app.
if (!isPreviewHost && !isInIframe && 'serviceWorker' in navigator) {
  const HEAL_FLAG = 'sw_heal_v2';
  const APP_BOOT_TIMEOUT_MS = 12000;

  // 1) Quando um novo SW assume o controle, recarrega UMA vez.
  let reloadedAfterControllerChange = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedAfterControllerChange) return;
    reloadedAfterControllerChange = true;
    window.location.reload();
  });

  // 2) Watchdog: se em 12s o app React ainda não montou (root vazio),
  //    assume que o SW está servindo algo quebrado → desregistra tudo,
  //    limpa caches e recarrega forçando rede.
  window.addEventListener('load', () => {
    setTimeout(async () => {
      const root = document.getElementById('root');
      const appBooted = !!root && root.childElementCount > 0;
      if (appBooted) return;

      if (sessionStorage.getItem(HEAL_FLAG)) return; // evita loop
      sessionStorage.setItem(HEAL_FLAG, '1');

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }
      } catch (e) {
        console.warn('[SW heal] erro ao limpar caches:', e);
      }
      window.location.reload();
    }, APP_BOOT_TIMEOUT_MS);
  });

  // Limpa flag de heal quando app monta com sucesso (rodada seguinte fica livre).
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => sessionStorage.removeItem(HEAL_FLAG), 5000);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
