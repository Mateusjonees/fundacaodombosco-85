import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Não mostra se já instalou, não é instalável, ou foi dispensado
  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-primary" />
        
        <div className="p-4">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Instalar o Sistema
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acesse mais rápido direto da tela inicial do seu dispositivo
              </p>
            </div>
          </div>

          <Button 
            onClick={installApp} 
            size="sm" 
            className="w-full mt-3 gap-2"
          >
            <Download className="h-4 w-4" />
            Instalar Agora
          </Button>
        </div>
      </div>
    </div>
  );
};
