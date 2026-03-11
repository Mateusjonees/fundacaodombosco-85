import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Versão do pedido - incrementar para forçar novo pedido a todos
const PERMISSION_VERSION = 'v2';
const STORAGE_KEY = `notification_permission_asked_${PERMISSION_VERSION}`;

export const NotificationPermissionBanner = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Só mostra se: usuário logado, browser suporta, e ainda não pediu nesta versão
    if (!user || !isSupported || permission !== 'default') return;

    const alreadyAsked = localStorage.getItem(STORAGE_KEY);
    if (alreadyAsked) return;

    // Mostra imediatamente após login
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  if (!open || permission !== 'default') return null;

  const handleAllow = async () => {
    await requestPermission();
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 mb-2">
            <Bell className="h-7 w-7 text-amber-600" />
          </div>
          <DialogTitle className="text-lg">Ativar Notificações</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Para receber alertas de pacientes, agenda e mensagens em tempo real, precisamos da sua permissão de notificações.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleAllow} className="w-full gap-2">
            <Bell className="h-4 w-4" />
            Permitir Notificações
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-muted-foreground">
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
