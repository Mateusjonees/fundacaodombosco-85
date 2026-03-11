import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const NotificationPermissionButton = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();

  // Só mostra se browser suporta e permissão ainda não foi concedida
  if (!isSupported || permission === 'granted') return null;

  const handleClick = async () => {
    await requestPermission();
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
        <p>Clique para ativar notificações</p>
      </TooltipContent>
    </Tooltip>
  );
};
