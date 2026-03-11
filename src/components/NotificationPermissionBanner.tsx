import { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPermissionBanner = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar imediatamente se permissão ainda não foi concedida
    if (isSupported && permission === 'default') {
      // Sempre exibir - sem verificar localStorage para garantir que todos vejam
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  // Não mostrar se já concedeu ou negou, ou se não suporta
  if (!show || !isSupported || permission !== 'default') return null;

  const handleAllow = async () => {
    await requestPermission();
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-card shadow-2xl animate-in zoom-in-95 duration-400">
        {/* Barra superior */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        <div className="p-6 text-center">
          {/* Ícone principal */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 ring-4 ring-amber-500/20">
            <Bell className="h-10 w-10 text-amber-500 animate-bounce" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            🔔 Ativar Notificações
          </h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            Para o sistema funcionar corretamente, precisamos da sua permissão para enviar notificações importantes:
          </p>

          {/* Lista de benefícios */}
          <div className="bg-muted/50 rounded-xl p-4 mb-5 text-left space-y-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Alerta de chegada</strong> — saiba quando seu paciente chegar
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Avisos de agenda</strong> — lembretes de consultas e reuniões
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Mensagens internas</strong> — receba mensagens em tempo real
              </span>
            </div>
          </div>

          {/* Botão principal */}
          <Button 
            onClick={handleAllow} 
            size="lg" 
            className="w-full gap-2 text-base font-semibold h-12"
          >
            <Bell className="h-5 w-5" />
            Permitir Notificações
          </Button>

          <p className="text-xs text-muted-foreground mt-3">
            Você pode alterar essa configuração a qualquer momento no seu navegador.
          </p>
        </div>
      </div>
    </div>
  );
};
