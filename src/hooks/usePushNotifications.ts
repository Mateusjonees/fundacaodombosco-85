import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar notificações push nativas do navegador.
 * Compatível com Chrome, Edge, Opera, Firefox e Safari.
 * Funciona no Windows como popup nativo estilo WhatsApp.
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
    console.log('[PushNotifications] Suporte a Notification API:', supported);
    console.log('[PushNotifications] Em iframe:', isInIframe);
    if (supported) {
      const currentPerm = Notification.permission;
      setPermission(currentPerm);
      console.log('[PushNotifications] Permissão atual:', currentPerm);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[PushNotifications] Notification API não suportada neste navegador');
      return false;
    }

    // Se já está granted, não precisa pedir novamente
    if (Notification.permission === 'granted') {
      console.log('[PushNotifications] Permissão já concedida');
      setPermission('granted');
      return true;
    }

    // Se foi negada, não adianta pedir novamente
    if (Notification.permission === 'denied') {
      console.warn('[PushNotifications] Permissão NEGADA pelo usuário. Precisa resetar nas configurações do navegador.');
      setPermission('denied');
      return false;
    }

    // Double-check: se permission atual não é default, atualizar estado
    const currentPerm = Notification.permission;
    if (currentPerm !== 'default') {
      setPermission(currentPerm);
      return currentPerm === 'granted';
    }

    try {
      console.log('[PushNotifications] Solicitando permissão...');
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[PushNotifications] Resultado da solicitação:', result);
      return result === 'granted';
    } catch (err) {
      console.warn('[PushNotifications] requestPermission() bloqueado (provavelmente iframe):', err);
      const fallbackPerm = Notification.permission;
      setPermission(fallbackPerm);
      return fallbackPerm === 'granted';
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions & { url?: string }) => {
    console.log('[PushNotifications] sendNotification chamado:', title, 'permissão:', permission);
    
    if (!isSupported) {
      console.warn('[PushNotifications] Notification API não suportada');
      return;
    }

    if (permission !== 'granted') {
      console.warn('[PushNotifications] Permissão não concedida, status:', permission);
      // Tentar verificar diretamente (pode ter mudado)
      if (Notification.permission === 'granted') {
        console.log('[PushNotifications] Permissão mudou para granted! Atualizando estado...');
        setPermission('granted');
      } else {
        return;
      }
    }
    
    const { url, ...notifOptions } = options || {};
    
    try {
      // Notificação nativa do Windows - aparece como popup do sistema
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: true, // Não fecha sozinha no Windows
        silent: false, // Toca som do sistema
        ...notifOptions,
      });

      console.log('[PushNotifications] ✅ Notificação nativa criada com sucesso!');

      notification.onclick = () => {
        console.log('[PushNotifications] Notificação clicada');
        window.focus();
        if (url) {
          window.location.href = url;
        }
        notification.close();
      };

      notification.onerror = (e) => {
        console.error('[PushNotifications] Erro na notificação:', e);
      };

      notification.onshow = () => {
        console.log('[PushNotifications] ✅ Notificação exibida no sistema!');
      };
    } catch (err) {
      console.error('[PushNotifications] Erro ao criar Notification:', err);
    }
  }, [permission, isSupported]);

  return { permission, isSupported, isInIframe, requestPermission, sendNotification };
};
