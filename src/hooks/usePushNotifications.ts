import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar notificações push do navegador.
 * Compatível com Chrome, Edge, Opera, Firefox e Safari.
 * Detecta contexto de iframe onde requestPermission é bloqueado.
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Detectar se estamos em um iframe (preview do Lovable, etc.)
  const isInIframe = typeof window !== 'undefined' && (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    // Em iframe, requestPermission é bloqueado silenciosamente
    // Tentamos mesmo assim, mas com tratamento de erro
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.warn('Notification.requestPermission() bloqueado:', err);
      // Atualiza o estado para refletir o que o browser realmente tem
      setPermission(Notification.permission);
      return Notification.permission === 'granted';
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions & { url?: string }) => {
    if (permission !== 'granted') return;
    
    const { url, ...notifOptions } = options || {};
    
    // Envia SEMPRE - pop-up nativo aparece mesmo com Word/outro programa aberto
    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      requireInteraction: true,
      ...notifOptions,
    });

    notification.onclick = () => {
      window.focus();
      if (url) {
        window.location.href = url;
      }
      notification.close();
    };
  }, [permission]);

  return { permission, isSupported, isInIframe, requestPermission, sendNotification };
};
