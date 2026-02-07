import { useState, useMemo } from 'react';
import { Download, ArrowLeft, CheckCircle2, Share, Plus, Menu, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// Detecção de navegador/plataforma
const detectBrowser = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isFirefox = /Firefox/.test(ua) && !/Seamonkey/.test(ua);
  const isEdge = /Edg\//.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg\//.test(ua) && !/SamsungBrowser/.test(ua) && !/OPR/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

  if (isIOS) return 'ios';
  if (isSamsung) return 'samsung';
  if (isEdge) return 'edge';
  if (isFirefox) return 'firefox';
  if (isChrome) return 'chrome';
  if (isSafari) return 'safari';
  return 'other';
};

type BrowserType = ReturnType<typeof detectBrowser>;

const BrowserInstructions = ({ browser, isInstallable, installing, onInstall }: {
  browser: BrowserType;
  isInstallable: boolean;
  installing: boolean;
  onInstall: () => void;
}) => {
  // Chrome/Edge/Samsung — botão automático + fallback
  if (browser === 'chrome' || browser === 'edge' || browser === 'samsung') {
    return (
      <div className="space-y-4">
        <Button
          size="lg"
          onClick={onInstall}
          disabled={installing || !isInstallable}
          className="gap-2 text-base px-10 h-14 rounded-xl shadow-lg shadow-primary/20"
        >
          <Download className="h-5 w-5" />
          {installing ? 'Instalando...' : 'Instalar com 1 Clique'}
        </Button>
        {!isInstallable && (
          <Card className="text-left">
            <CardContent className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Se o botão não funcionar, toque no menu <Menu className="inline h-4 w-4 mx-0.5" /> do navegador e selecione <strong>"Instalar aplicativo"</strong>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Safari / iOS
  if (browser === 'ios' || browser === 'safari') {
    return (
      <Card className="text-left">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-medium text-foreground">
            Siga estes 3 passos para instalar:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
              <p>Toque no botão <strong>"Compartilhar"</strong> <Share className="inline h-4 w-4 mx-0.5" /> na barra do Safari</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>
              <p>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <Plus className="inline h-4 w-4 mx-0.5" /></p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</span>
              <p>Confirme tocando em <strong>"Adicionar"</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Firefox
  if (browser === 'firefox') {
    return (
      <div className="space-y-4">
        <Card className="text-left border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-amber-500" />
              Dica: abra no Chrome para instalar automaticamente
            </p>
            <p className="text-xs text-muted-foreground">
              O Firefox tem suporte limitado à instalação de apps. Para a melhor experiência, abra este link no <strong>Google Chrome</strong>.
            </p>
          </CardContent>
        </Card>
        <Card className="text-left">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Ou instale manualmente:</p>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
              <p>Toque no menu <Menu className="inline h-4 w-4 mx-0.5" /> e selecione <strong>"Instalar"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Outros navegadores
  return (
    <Card className="text-left">
      <CardContent className="p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">
          Para instalar, siga um destes passos:
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>📱 Android:</strong> Abra no Chrome → Menu ⋮ → "Instalar aplicativo"</p>
          <p><strong>🍎 iPhone:</strong> Abra no Safari → Compartilhar ↑ → "Adicionar à Tela de Início"</p>
          <p><strong>💻 PC:</strong> Abra no Chrome ou Edge → Ícone de instalar na barra de endereço</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Install = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const browser = useMemo(() => detectBrowser(), []);

  const handleInstall = async () => {
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
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
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden">
            {isInstalled ? (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            ) : (
              <img src="/favicon.png" alt="Fundação Dom Bosco" className="h-16 w-16 object-contain" />
            )}
          </div>

          {/* Título */}
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

          {/* Ação principal */}
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Já instalado ✓
            </div>
          ) : (
            <BrowserInstructions
              browser={browser}
              isInstallable={isInstallable}
              installing={installing}
              onInstall={handleInstall}
            />
          )}

          {/* Benefícios */}
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
