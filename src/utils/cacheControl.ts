// Utilitário para controle de cache e atualização automática

const APP_VERSION_KEY = 'app_version';
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now().toString();

/**
 * Verifica se há uma nova versão do app e força reload se necessário
 */
export const checkForUpdates = async (): Promise<boolean> => {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    
    if (storedVersion !== BUILD_TIMESTAMP) {
      console.log('[Cache] Nova versão detectada, atualizando...');
      localStorage.setItem(APP_VERSION_KEY, BUILD_TIMESTAMP);
      
      // Se já tinha uma versão antiga, força reload
      if (storedVersion) {
        await clearAppCache();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[Cache] Erro ao verificar atualizações:', error);
    return false;
  }
};

/**
 * Limpa o cache do Service Worker e do navegador
 */
export const clearAppCache = async (): Promise<void> => {
  try {
    // Limpa caches do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[Cache] Caches do navegador limpos');
    }

    // Remove service workers antigos
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('[Cache] Service Workers removidos');
    }

    // Força reload sem cache
    window.location.reload();
  } catch (error) {
    console.error('[Cache] Erro ao limpar cache:', error);
    window.location.reload();
  }
};

/**
 * Força atualização manual do app
 */
export const forceRefresh = (): void => {
  localStorage.removeItem(APP_VERSION_KEY);
  clearAppCache();
};
