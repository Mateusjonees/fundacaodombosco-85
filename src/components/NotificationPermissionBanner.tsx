import { useState, useEffect } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Versão do pedido - incrementar para forçar novo pedido a todos
const PERMISSION_VERSION = 'v3';
const STORAGE_KEY = `notification_permission_asked_${PERMISSION_VERSION}`;

export const NotificationPermissionBanner = () => {
  const { permission, isSupported, isInIframe, requestPermission } = usePushNotifications();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user || !isSupported || permission === 'granted') return;

    const alreadyAsked = localStorage.getItem(STORAGE_KEY);
    if (alreadyAsked) return;

    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  if (!open) return null;

  const handleAllow = async () => {
    setRequesting(true);

    // Se estamos em iframe ou permissão bloqueada, orientar o usuário
    if (isInIframe) {
      toast.info('Abra o site diretamente no navegador', {
        description: 'Notificações não podem ser ativadas dentro do preview. Abra a URL publicada diretamente no navegador para ativar.',
        duration: 8000,
      });
      localStorage.setItem(STORAGE_KEY, 'true');
      setOpen(false);
      setRequesting(false);
      return;
    }

    if (permission === 'denied') {
      showManualInstructions();
      localStorage.setItem(STORAGE_KEY, 'true');
      setOpen(false);
      setRequesting(false);
      return;
    }

    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('Notificações ativadas com sucesso! 🔔');
      } else {
        // Pode ter sido bloqueado silenciosamente
        const currentPerm = 'Notification' in window ? Notification.permission : 'denied';
        if (currentPerm === 'denied') {
          showManualInstructions();
        } else {
          toast.info('Permissão não concedida. Você pode ativar depois pelo ícone de sino.');
        }
      }
    } catch {
      showManualInstructions();
    }

    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setRequesting(false);
  };

  const showManualInstructions = () => {
    // Detectar navegador para instruções específicas
    const ua = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (ua.includes('opr') || ua.includes('opera')) {
      instructions = 'No Opera: clique no ícone de cadeado 🔒 na barra de endereço → Configurações do site → Notificações → Permitir.';
    } else if (ua.includes('edg')) {
      instructions = 'No Edge: clique no ícone de cadeado 🔒 na barra de endereço → Permissões do site → Notificações → Permitir.';
    } else if (ua.includes('firefox')) {
      instructions = 'No Firefox: clique no ícone de escudo/cadeado na barra de endereço → Permissões → Notificações → Permitir.';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      instructions = 'No Safari: vá em Ajustes do Safari → Sites → Notificações → Permitir para este site.';
    } else {
      instructions = 'Clique no ícone de cadeado 🔒 na barra de endereço → Configurações do site → Notificações → Permitir.';
    }

    toast.error('Notificações bloqueadas pelo navegador', {
      description: instructions + ' Depois recarregue a página.',
      duration: 12000,
    });
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

        {isInIframe && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ Você está no modo preview. Abra o site publicado diretamente no navegador para ativar notificações.
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleAllow} className="w-full gap-2" disabled={requesting}>
            <Bell className="h-4 w-4" />
            {requesting ? 'Ativando...' : isInIframe ? 'Entendi' : 'Permitir Notificações'}
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-muted-foreground">
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
