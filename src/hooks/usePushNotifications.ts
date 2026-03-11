import { useState, useEffect, useCallback } from 'react';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
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

  return { permission, isSupported, requestPermission, sendNotification };
};
