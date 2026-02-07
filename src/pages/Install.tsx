import { useState } from 'react';
import { Download, Smartphone, Monitor, Apple, Chrome, Share, Plus, MoreVertical, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-lg font-semibold text-foreground">Instalar o Sistema</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-2">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Instale o Sistema FDB
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Acesse o sistema direto da tela inicial do seu celular ou computador, sem precisar abrir o navegador.
          </p>

          {/* Status / Install Button */}
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Aplicativo já instalado neste dispositivo!
            </div>
          ) : isInstallable ? (
            <Button
              size="lg"
              onClick={handleInstall}
              disabled={installing}
              className="gap-2 text-base px-8"
            >
              <Download className="h-5 w-5" />
              {installing ? 'Instalando...' : 'Instalar Agora'}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Siga as instruções abaixo para instalar manualmente
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: 'Acesso Rápido', desc: 'Abra direto da tela inicial, sem digitar URL' },
            { icon: '📱', title: 'Tela Cheia', desc: 'Sem barra de navegação do browser' },
            { icon: '🔔', title: 'Notificações', desc: 'Receba alertas mesmo com o app fechado' },
          ].map((b) => (
            <Card key={b.title} className="border-dashed">
              <CardContent className="p-4 text-center space-y-1">
                <span className="text-2xl">{b.icon}</span>
                <p className="font-semibold text-sm text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions Tabs */}
        <Tabs defaultValue="android" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="android" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Chrome className="h-4 w-4" />
              Android
            </TabsTrigger>
            <TabsTrigger value="ios" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Apple className="h-4 w-4" />
              iPhone/iPad
            </TabsTrigger>
            <TabsTrigger value="desktop" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Monitor className="h-4 w-4" />
              Computador
            </TabsTrigger>
          </TabsList>

          {/* Android */}
          <TabsContent value="android" className="mt-6">
            <div className="space-y-4">
              <StepCard
                step={1}
                title="Abra no Google Chrome"
                description="Acesse o sistema pelo navegador Chrome no seu celular Android."
                icon={<Chrome className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={2}
                title='Toque no menu ⋮'
                description="Toque nos três pontinhos no canto superior direito do Chrome."
                icon={<MoreVertical className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={3}
                title='"Instalar aplicativo" ou "Adicionar à tela inicial"'
                description='Selecione a opção "Instalar aplicativo" no menu. Se não aparecer, procure "Adicionar à tela inicial".'
                icon={<Download className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={4}
                title="Confirme a instalação"
                description='Toque em "Instalar" na janela que aparecer. O ícone será adicionado à sua tela inicial.'
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              />
            </div>
          </TabsContent>

          {/* iOS */}
          <TabsContent value="ios" className="mt-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
                ⚠️ No iPhone/iPad, use obrigatoriamente o <strong>Safari</strong>. Outros navegadores não permitem instalação de apps.
              </div>
              <StepCard
                step={1}
                title="Abra no Safari"
                description="Acesse o sistema usando o navegador Safari (navegador padrão da Apple)."
                icon={<ExternalLink className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={2}
                title='Toque no botão "Compartilhar"'
                description="Toque no ícone de compartilhamento (quadrado com seta para cima) na barra inferior do Safari."
                icon={<Share className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={3}
                title='"Adicionar à Tela de Início"'
                description='Role para baixo no menu e toque em "Adicionar à Tela de Início".'
                icon={<Plus className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={4}
                title='Toque em "Adicionar"'
                description='Confirme o nome do app e toque em "Adicionar" no canto superior direito.'
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              />
            </div>
          </TabsContent>

          {/* Desktop */}
          <TabsContent value="desktop" className="mt-6">
            <div className="space-y-4">
              <StepCard
                step={1}
                title="Abra no Chrome ou Edge"
                description="Acesse o sistema pelo Google Chrome ou Microsoft Edge no seu computador."
                icon={<Chrome className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={2}
                title="Clique no ícone de instalação"
                description='Na barra de endereço (URL), clique no ícone de instalação (monitor com seta) que aparece à direita.'
                icon={<Download className="h-5 w-5 text-primary" />}
              />
              <StepCard
                step={3}
                title='Clique em "Instalar"'
                description='Confirme clicando em "Instalar" no pop-up. O app abrirá em sua própria janela.'
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              />
              <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Após instalar, o app aparecerá no menu Iniciar (Windows) ou no Launchpad (Mac).
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Perguntas Frequentes</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">O app ocupa muito espaço?</p>
                <p className="text-muted-foreground">Não! O app instalado ocupa menos de 5MB, muito menos que um app tradicional.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Preciso de loja de apps?</p>
                <p className="text-muted-foreground">Não. A instalação é feita direto pelo navegador, sem precisar da Play Store ou App Store.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">O app atualiza sozinho?</p>
                <p className="text-muted-foreground">Sim! Sempre que houver uma atualização, o app baixa automaticamente ao ser aberto.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Componente de passo reutilizável
const StepCard = ({ step, title, description, icon }: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex items-start gap-4 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {step}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {icon}
            <p className="font-semibold text-sm text-foreground">{title}</p>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Install;
