import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPermissionBanner = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostra o banner após 5 segundos se ainda não pediu permissão
    if (isSupported && permission === 'default') {
      const alreadyAsked = localStorage.getItem('notification_banner_dismissed');
      if (!alreadyAsked) {
        const timer = setTimeout(() => setShow(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, permission]);

  if (!show || dismissed || permission !== 'default') return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  const handleAllow = async () => {
    await requestPermission();
    setDismissed(true);
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
        
        <div className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Ativar Notificações
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receba alertas de pacientes, agenda e mensagens mesmo fora do sistema
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleDismiss} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              Depois
            </Button>
            <Button 
              onClick={handleAllow} 
              size="sm" 
              className="flex-1 gap-2"
            >
              <Bell className="h-3.5 w-3.5" />
              Permitir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
