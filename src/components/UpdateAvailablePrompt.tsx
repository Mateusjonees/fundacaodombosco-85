import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { isUserBusy } from '@/utils/safeReload';

/**
 * Mostra um aviso discreto quando há versão nova do sistema.
 * Nunca recarrega sozinho: o usuário escolhe a hora para não perder o que está escrevendo.
 */
export const UpdateAvailablePrompt = () => {
  const shownRef = useRef(false);

  useEffect(() => {
    const handleUpdate = () => {
      if (shownRef.current) return;
      shownRef.current = true;

      toast('Nova versão do sistema disponível', {
        description: 'Salve o que estiver fazendo e clique em Atualizar.',
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => {
            if (isUserBusy() && !window.confirm('Há informações não salvas na tela. Atualizar mesmo assim?')) {
              shownRef.current = false;
              return;
            }
            window.location.reload();
          },
        },
      });
    };

    window.addEventListener('app:update-available', handleUpdate);
    return () => window.removeEventListener('app:update-available', handleUpdate);
  }, []);

  return null;
};
