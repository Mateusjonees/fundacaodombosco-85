import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Botão flutuante "voltar ao topo" que aparece após scroll
 */
export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-20 md:bottom-6 left-6 z-40 h-10 w-10 rounded-full shadow-lg",
        "bg-background/90 backdrop-blur-sm border-border/80",
        "animate-fade-in hover:scale-110 transition-all duration-200"
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
};
