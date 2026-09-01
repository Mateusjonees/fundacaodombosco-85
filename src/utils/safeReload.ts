// Evita recarregar a página enquanto o usuário está digitando (ex.: evolução clínica).
// Todo reload automático do app deve passar por aqui.

declare global {
  interface Window {
    __UNSAVED_WORK__?: number;
  }
}

/** Marca que existe trabalho não salvo em andamento (formulários, evoluções, etc.). */
export const markUnsavedWork = () => {
  window.__UNSAVED_WORK__ = (window.__UNSAVED_WORK__ ?? 0) + 1;
};

/** Libera uma marcação de trabalho não salvo. */
export const clearUnsavedWork = () => {
  window.__UNSAVED_WORK__ = Math.max(0, (window.__UNSAVED_WORK__ ?? 0) - 1);
};

/** Usuário está digitando ou tem conteúdo não salvo em algum campo? */
export const isUserBusy = (): boolean => {
  try {
    if ((window.__UNSAVED_WORK__ ?? 0) > 0) return true;

    const el = document.activeElement as HTMLElement | null;
    if (el) {
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return true;
    }

    // Qualquer textarea com texto = provável evolução/prontuário em andamento
    const areas = document.querySelectorAll('textarea');
    for (const a of Array.from(areas)) {
      if ((a as HTMLTextAreaElement).value.trim().length > 0) return true;
    }

    // Diálogos abertos: não interromper o fluxo do usuário
    if (document.querySelector('[role="dialog"][data-state="open"]')) return true;

    return false;
  } catch {
    return false;
  }
};

/**
 * Recarrega apenas quando for seguro. Se o usuário estiver digitando,
 * tenta novamente periodicamente em vez de descartar o trabalho dele.
 */
export const requestSafeReload = (reason = 'update') => {
  const attempt = () => {
    if (!isUserBusy() && document.visibilityState === 'visible') {
      console.warn(`[SafeReload] recarregando (${reason})`);
      window.location.reload();
      return;
    }
    console.warn(`[SafeReload] adiado (${reason}) — usuário ocupado`);
    setTimeout(attempt, 30000);
  };
  attempt();
};
