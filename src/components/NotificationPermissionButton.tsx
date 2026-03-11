import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

/**
 * Botão de sino no header para ativar notificações manualmente.
 * Detecta navegador para instruções específicas quando bloqueado.
 */
export const NotificationPermissionButton = () => {
  const { permission, isSupported, isInIframe, requestPermission } = usePushNotifications();

  // Só mostra se browser suporta e permissão ainda não foi concedida
  if (!isSupported || permission === 'granted') return null;

  const showBrowserInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    let browser = 'seu navegador';
    let steps = '';

    if (ua.includes('opr') || ua.includes('opera')) {
      browser = 'Opera';
      steps = 'Clique no ícone de cadeado 🔒 na barra de endereço → Configurações do site → Notificações → Permitir.';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
      steps = 'Clique no ícone de cadeado 🔒 na barra de endereço → Permissões do site → Notificações → Permitir.';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
      steps = 'Clique no ícone de escudo/cadeado na barra de endereço → Permissões → Notificações → Permitir.';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
      steps = 'Vá em Ajustes do Safari → Sites → Notificações → Permitir para este site.';
    } else {
      browser = 'Chrome';
      steps = 'Clique no ícone de cadeado 🔒 na barra de endereço → Configurações do site → Notificações → Permitir.';
    }

    toast.error(`Notificações bloqueadas no ${browser}`, {
      description: steps + ' Depois recarregue a página.',
      duration: 12000,
    });
  };

  const handleClick = async () => {
    // Se em iframe, avisa que precisa abrir diretamente
    if (isInIframe) {
      toast.info('Abra o site diretamente no navegador', {
        description: 'Notificações não funcionam no modo preview. Acesse a URL publicada diretamente.',
        duration: 8000,
      });
      return;
    }

    if (permission === 'denied') {
      showBrowserInstructions();
      return;
    }

    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('Notificações ativadas com sucesso! 🔔');
      } else {
        // Verifica se foi bloqueado
        const currentPerm = 'Notification' in window ? Notification.permission : 'denied';
        if (currentPerm === 'denied') {
          showBrowserInstructions();
        } else {
          toast.info('Permissão não concedida. Tente novamente.');
        }
      }
    } catch {
      showBrowserInstructions();
    }
  };

  const tooltipText = isInIframe
    ? 'Abra o site no navegador para ativar'
    : permission === 'denied'
      ? 'Notificações bloqueadas — clique para instruções'
      : 'Clique para ativar notificações';

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
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};
