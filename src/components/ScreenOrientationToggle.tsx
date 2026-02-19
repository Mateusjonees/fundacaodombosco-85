import { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const ScreenOrientationToggle = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const supported = !!(screen.orientation && typeof screen.orientation.lock === 'function');
      setIsSupported(supported);
    };

    const checkScreen = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    const updateOrientation = () => {
      if (screen.orientation) {
        setIsLandscape(screen.orientation.type.includes('landscape'));
      }
    };

    checkSupport();
    checkScreen();
    updateOrientation();

    window.addEventListener('resize', checkScreen);
    screen.orientation?.addEventListener('change', updateOrientation);

    return () => {
      window.removeEventListener('resize', checkScreen);
      screen.orientation?.removeEventListener('change', updateOrientation);
    };
  }, []);

  const toggleOrientation = useCallback(async () => {
    try {
      // Most browsers require fullscreen to lock orientation
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (isLandscape) {
        await screen.orientation.lock('portrait');
      } else {
        await screen.orientation.lock('landscape');
      }
    } catch {
      // If fullscreen+lock fails, try just CSS-based approach via meta viewport
      toast.info('Rotação automática não suportada neste navegador. Gire o dispositivo manualmente e desative o bloqueio de rotação.');
    }
  }, [isLandscape]);

  if (!isSupported || !isSmallScreen) return null;

  return (
    <button
      onClick={toggleOrientation}
      className="fixed bottom-20 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform md:bottom-6"
      aria-label={isLandscape ? 'Mudar para retrato' : 'Mudar para paisagem'}
    >
      <RotateCcw className={`h-5 w-5 transition-transform ${isLandscape ? 'rotate-90' : ''}`} />
    </button>
  );
};
