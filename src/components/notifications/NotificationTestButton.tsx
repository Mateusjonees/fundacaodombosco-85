import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { mostrarNotificacao } from '@/components/notifications/NotificationProvider';

export const NotificationTestButton = () => {
  const handleTest = () => {
    mostrarNotificacao(
      'Sistema Clínico',
      '🔔 Teste de notificação funcionando com popup, som e navegador.',
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
