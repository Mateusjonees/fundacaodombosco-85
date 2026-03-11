import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export interface AppNotificationOptions {
  url?: string;
  dedupeKey?: string;
  tag?: string;
  duration?: number;
}

interface NotificationContextValue {
  mostrarNotificacao: (titulo: string, mensagem: string, options?: AppNotificationOptions) => void;
  permission: NotificationPermission;
  isSupported: boolean;
  isInIframe: boolean;
  requestPermission: () => Promise<boolean>;
}

interface NotificationEventDetail {
  titulo: string;
  mensagem: string;
  options?: AppNotificationOptions;
}

const APP_NOTIFICATION_EVENT = 'app:notify';
const DEDUPE_WINDOW_MS = 8000;

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const mostrarNotificacao = (titulo: string, mensagem: string, options?: AppNotificationOptions) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<NotificationEventDetail>(APP_NOTIFICATION_EVENT, {
      detail: { titulo, mensagem, options },
    })
  );
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (startTime: number, freq: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(0.32, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.22);
    };

    playBeep(audioContext.currentTime, 880);
    playBeep(audioContext.currentTime + 0.26, 1100);
  } catch (error) {
    console.warn('[AppNotifications] Não foi possível tocar o som:', error);
  }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { permission, isSupported, isInIframe, requestPermission, sendNotification } = usePushNotifications();
  const shownNotificationsRef = useRef<Map<string, number>>(new Map());

  const executeNotification = useCallback((titulo: string, mensagem: string, options?: AppNotificationOptions) => {
    const dedupeKey = options?.dedupeKey || `${titulo}:${mensagem}`;
    const lastShownAt = shownNotificationsRef.current.get(dedupeKey);

    if (lastShownAt && Date.now() - lastShownAt < DEDUPE_WINDOW_MS) {
      console.log('[AppNotifications] Duplicata ignorada:', dedupeKey);
      return;
    }

    shownNotificationsRef.current.set(dedupeKey, Date.now());

    playNotificationSound();

    toast(titulo, {
      description: mensagem,
      duration: options?.duration ?? 5000,
      closeButton: true,
    });

    sendNotification(titulo, {
      body: mensagem,
      tag: options?.tag || dedupeKey,
      url: options?.url || '/schedule',
      requireInteraction: true,
    });

    console.log('[AppNotifications] Notificação disparada:', { titulo, mensagem, dedupeKey });
  }, [sendNotification]);

  useEffect(() => {
    const handleAppNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEventDetail>;
      executeNotification(customEvent.detail.titulo, customEvent.detail.mensagem, customEvent.detail.options);
    };

    window.addEventListener(APP_NOTIFICATION_EVENT, handleAppNotification as EventListener);
    return () => window.removeEventListener(APP_NOTIFICATION_EVENT, handleAppNotification as EventListener);
  }, [executeNotification]);

  useEffect(() => {
    if (!isSupported) return;

    requestPermission().catch((error) => {
      console.warn('[AppNotifications] Erro ao solicitar permissão:', error);
    });
  }, [isSupported, requestPermission]);

  const value = useMemo<NotificationContextValue>(() => ({
    mostrarNotificacao: executeNotification,
    permission,
    isSupported,
    isInIframe,
    requestPermission,
  }), [executeNotification, permission, isSupported, isInIframe, requestPermission]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useAppNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useAppNotifications deve ser usado dentro de NotificationProvider');
  }

  return context;
};
