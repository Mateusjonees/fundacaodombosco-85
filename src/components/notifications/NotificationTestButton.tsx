import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { mostrarNotificacao } from '@/components/notifications/NotificationProvider';
import { toast } from 'sonner';

/**
 * Botão de teste de notificações com diagnóstico embutido.
 * Informa ao usuário se as notificações nativas estão bloqueadas.
 */
export const NotificationTestButton = () => {
  const handleTest = () => {
    // Diagnóstico: checar permissão atual
    const isSupported = 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'unsupported';

    console.log('[NotificationTest] Suporte:', isSupported, '| Permissão:', permission);

    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações nativas.', { duration: 8000 });
      return;
    }

    if (permission === 'denied') {
      const ua = navigator.userAgent.toLowerCase();
      let instructions = '';

      if (ua.includes('opr') || ua.includes('opera')) {
        instructions = '🔒 No Opera: Clique no cadeado na barra de endereço → Configurações do site → Notificações → Permitir. Depois recarregue a página.';
      } else if (ua.includes('edg')) {
        instructions = '🔒 No Edge: Clique no cadeado → Permissões → Notificações → Permitir. Recarregue.';
      } else if (ua.includes('firefox')) {
        instructions = '🔒 No Firefox: Clique no cadeado → Permissões → Notificações → Permitir. Recarregue.';
      } else {
        instructions = '🔒 No Chrome: Clique no cadeado na barra de endereço → Configurações do site → Notificações → Permitir. Recarregue.';
      }

      toast.error('⚠️ Notificações BLOQUEADAS no navegador', {
        description: instructions,
        duration: 15000,
        closeButton: true,
      });

      // Ainda dispara o toast interno + som para provar que funciona
      mostrarNotificacao(
        'Sistema Clínico — SOMENTE INTERNO',
        '⚠️ A notificação nativa do Windows está BLOQUEADA. Siga as instruções para ativar.',
        { dedupeKey: `test-blocked-${Date.now()}`, tag: `test-blocked-${Date.now()}` }
      );
      return;
    }

    if (permission === 'default') {
      // Pedir permissão primeiro
      Notification.requestPermission().then((result) => {
        console.log('[NotificationTest] Resultado da permissão:', result);
        if (result === 'granted') {
          toast.success('✅ Notificações ativadas! Testando agora...');
          dispararTeste();
        } else {
          toast.error('Você recusou as notificações. Para ativar depois, clique no cadeado na barra de endereço.');
        }
      });
      return;
    }

    // Permissão granted — disparar teste completo
    dispararTeste();
  };

  const dispararTeste = () => {
    mostrarNotificacao(
      'Sistema Clínico',
      '🔔 Teste de notificação funcionando! Pop-up nativo + som + toast.',
      {
        dedupeKey: `manual-test-${Date.now()}`,
        tag: `manual-test-${Date.now()}`,
        url: '/schedule',
      }
    );
  };

  return (
    <Button variant="outline" size="sm" onClick={handleTest} className="gap-2">
      <BellRing className="h-4 w-4" />
      <span className="hidden lg:inline">Testar Notificação</span>
    </Button>
  );
};
