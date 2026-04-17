import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

// AUTO-HEAL agressivo: detecta SW preso/desatualizado E "boot parcial"
// (React montou mas app não ficou utilizável em X segundos) e força limpeza total.
// AUTO-UPDATE silencioso por versão de build.
// Cada build tem um VITE_BUILD_TIMESTAMP único. Se o cliente tiver uma versão
// diferente da última conhecida, limpa SW + caches automaticamente uma vez.
// Isso resolve usuários "presos" em versão antiga do PWA sem ação manual.
if (!isPreviewHost && !isInIframe) {
  try {
    const CURRENT_BUILD = (import.meta as any).env?.VITE_BUILD_TIMESTAMP || 'dev';
    const STORED_BUILD = localStorage.getItem('app_build_version');
    const AUTO_UPDATE_FLAG = 'auto_update_done';

    if (STORED_BUILD && STORED_BUILD !== CURRENT_BUILD && !sessionStorage.getItem(AUTO_UPDATE_FLAG)) {
      sessionStorage.setItem(AUTO_UPDATE_FLAG, '1');
      console.warn('[Auto-update] Nova versão detectada, limpando caches...', { STORED_BUILD, CURRENT_BUILD });
      localStorage.setItem('app_build_version', CURRENT_BUILD);

      (async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }
        } catch (e) {
          console.warn('[Auto-update] erro ao limpar:', e);
        }
        window.location.reload();
      })();
    } else if (!STORED_BUILD) {
      localStorage.setItem('app_build_version', CURRENT_BUILD);
    }
  } catch (e) {
    console.warn('[Auto-update] erro:', e);
  }
}

if (!isPreviewHost && !isInIframe && 'serviceWorker' in navigator) {
  const HEAL_FLAG = 'sw_heal_v3';
  const APP_BOOT_TIMEOUT_MS = 12000;

  // Quando um novo SW assume o controle, recarrega UMA vez.
  let reloadedAfterControllerChange = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedAfterControllerChange) return;
    reloadedAfterControllerChange = true;
    window.location.reload();
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
    window.location.reload();
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
