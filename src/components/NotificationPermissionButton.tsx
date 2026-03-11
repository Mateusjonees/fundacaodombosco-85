import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export const NotificationPermissionButton = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();

  // Só mostra se browser suporta e permissão ainda não foi concedida
  if (!isSupported || permission === 'granted') return null;

  const handleClick = async () => {
    if (permission === 'denied') {
      toast.error('Notificações bloqueadas', {
        description: 'As notificações foram bloqueadas anteriormente. Para ativar, clique no ícone de cadeado 🔒 na barra de endereço do navegador → Permissões → Notificações → Permitir. Depois recarregue a página.',
        duration: 10000,
      });
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      toast.success('Notificações ativadas com sucesso! 🔔');
    } else {
      toast.error('Notificações bloqueadas', {
        description: 'Para ativar, clique no ícone de cadeado 🔒 na barra de endereço → Permissões → Notificações → Permitir.',
        duration: 8000,
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className="h-8 w-8 rounded-md hover:bg-muted/60 relative"
          title="Ativar Notificações"
        >
          <BellRing className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{permission === 'denied' ? 'Notificações bloqueadas — clique para instruções' : 'Clique para ativar notificações'}</p>
      </TooltipContent>
    </Tooltip>
  );
};
