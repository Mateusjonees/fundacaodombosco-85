import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { requestSafeReload } from './utils/safeReload';

// Marcador global de boot bem-sucedido. Quando o app realmente fica utilizável
// (login renderizado OU dashboard renderizado), setamos window.__APP_READY__ = true.
// Veja App.tsx / LoginForm: o watchdog abaixo monitora esse flag.
declare global {
  interface Window {
    __APP_READY__?: boolean;
  }
}

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

// Versão de build: apenas registra. Quem abre o app já está rodando o código novo,
// então NÃO recarregamos a página (recarregar fazia a tela piscar e perder conteúdo).
try {
  const CURRENT_BUILD = (import.meta as any).env?.VITE_BUILD_TIMESTAMP || 'dev';
  localStorage.setItem('app_build_version', CURRENT_BUILD);
  localStorage.setItem('app_version', CURRENT_BUILD);
} catch {
  /* noop */
}

/** Avisa a interface que existe uma versão nova; o usuário decide quando atualizar. */
const announceUpdate = (reason: string) => {
  console.info(`[Update] nova versão disponível (${reason})`);
  window.dispatchEvent(new CustomEvent('app:update-available'));
};

// Arquivo de tela antigo não encontrado (após publicação nova): avisa em vez de recarregar sozinho.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  announceUpdate('preload-error');
});

if (!isPreviewHost && !isInIframe && 'serviceWorker' in navigator) {
  const HEAL_FLAG = 'sw_heal_v3';
  const APP_BOOT_TIMEOUT_MS = 12000;
  // Se a página já era controlada por um SW, a troca de controle significa versão nova.
  const hadControllerAtStart = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadControllerAtStart) announceUpdate('controllerchange');
  });

  const performHardHeal = async (reason: string) => {
    if (sessionStorage.getItem(HEAL_FLAG)) {
      console.warn(`[SW heal] Já tentou curar nesta sessão (${reason}), abortando para evitar loop.`);
      return;
    }
    sessionStorage.setItem(HEAL_FLAG, '1');
    console.warn(`[SW heal] Disparando limpeza forçada. Motivo: ${reason}`);

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
    requestSafeReload(`sw-heal:${reason}`);
  };

  // Watchdog principal: se em 12s o app não estiver utilizável, cura.
  // "Utilizável" = window.__APP_READY__ ou root tem mais de 1 filho real.
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.__APP_READY__) return;

      const root = document.getElementById('root');
      const appBooted = !!root && root.childElementCount > 0;

      // Heurística: se mostra apenas spinner/"Carregando" sem ter sinalizado pronto,
      // tratamos como travado.
      const text = root?.innerText?.toLowerCase() ?? '';
      const looksStuck =
        !appBooted ||
        text.includes('carregando') ||
        text.includes('verificando permiss');

      if (looksStuck) {
        void performHardHeal(appBooted ? 'boot-parcial' : 'root-vazio');
      }
    }, APP_BOOT_TIMEOUT_MS);
  });

  // Limpa flag de heal quando app monta com sucesso de verdade.
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.__APP_READY__) {
        sessionStorage.removeItem(HEAL_FLAG);
      }
    }, 6000);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
