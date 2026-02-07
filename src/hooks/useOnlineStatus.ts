import { useState, useEffect, useCallback, useRef } from 'react';
import { processSyncQueue, getPendingCount } from '@/utils/syncQueue';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para monitorar status online/offline e sincronização automática
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();
  const wasOfflineRef = useRef(!navigator.onLine);

  // Atualiza contagem de operações pendentes
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB pode não estar disponível
    }
  }, []);

  // Sincroniza quando volta online
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    const count = await getPendingCount();
    if (count === 0) return;

    setIsSyncing(true);
    try {
      const result = await processSyncQueue();
      await refreshPendingCount();

      if (result.synced > 0) {
        toast({
          title: '✅ Dados sincronizados',
          description: `${result.synced} operação(ões) sincronizada(s) com sucesso.`,
        });
      }
      if (result.failed > 0) {
        toast({
          title: '⚠️ Erro na sincronização',
          description: `${result.failed} operação(ões) falharam. Tentaremos novamente.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Sync] Erro:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount, toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        toast({
          title: '🟢 Conexão restaurada',
          description: 'Sincronizando dados...',
        });
        // Aguarda 1s antes de sync para conexão estabilizar
        setTimeout(syncNow, 1000);
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      toast({
        title: '🔴 Sem conexão',
        description: 'Trabalhando offline. Os dados serão salvos localmente.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Checar pendentes ao iniciar
    refreshPendingCount();

    // Sync periódico a cada 30s se online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        refreshPendingCount();
        syncNow();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncNow, refreshPendingCount, toast]);

  return { isOnline, isSyncing, pendingCount, syncNow, refreshPendingCount };
};
