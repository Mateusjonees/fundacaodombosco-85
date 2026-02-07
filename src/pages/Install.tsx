import { useState } from 'react';
import { Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const Install = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-lg font-semibold text-foreground">Instalar o Sistema</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden">
            {isInstalled ? (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            ) : (
              <img src="/favicon.png" alt="Fundação Dom Bosco" className="h-16 w-16 object-contain" />
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {isInstalled ? 'App Instalado!' : 'Instale o Sistema FDB'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {isInstalled
                ? 'O aplicativo já está instalado neste dispositivo. Acesse pela tela inicial.'
                : 'Acesse direto da tela inicial do seu celular ou computador, sem precisar abrir o navegador.'}
            </p>
          </div>

          {/* Main Action */}
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Já instalado ✓
            </div>
          ) : isInstallable ? (
            <Button
              size="lg"
              onClick={handleInstall}
              disabled={installing}
              className="gap-2 text-base px-10 h-14 rounded-xl shadow-lg shadow-primary/20"
            >
              <Download className="h-5 w-5" />
              {installing ? 'Instalando...' : 'Instalar com 1 Clique'}
            </Button>
          ) : (
            <Card className="text-left">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  O botão automático não está disponível neste navegador. Siga os passos:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>📱 Android (Chrome):</strong> Menu ⋮ → "Instalar aplicativo"</p>
                  <p><strong>🍎 iPhone (Safari):</strong> Compartilhar ↑ → "Adicionar à Tela de Início"</p>
                  <p><strong>💻 PC (Chrome/Edge):</strong> Ícone de instalar na barra de endereço</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: '⚡', label: 'Acesso rápido' },
              { icon: '📱', label: 'Tela cheia' },
              { icon: '🔔', label: 'Notificações' },
            ].map((b) => (
              <div key={b.label} className="text-center space-y-1">
                <span className="text-xl">{b.icon}</span>
                <p className="text-xs text-muted-foreground">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
