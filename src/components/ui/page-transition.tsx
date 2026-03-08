import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Animação de transição suave entre páginas usando a rota como key
 */
export const PageTransition = ({ children, className }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <div 
      key={location.pathname}
      className={cn(
        "animate-page-enter",
        className
      )}
    >
      {children}
    </div>
  );
};
