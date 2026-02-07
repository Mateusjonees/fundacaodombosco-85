import { Wifi, WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const OfflineStatusBar = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOnlineStatus();

  // Não mostra se está online e sem pendências
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 text-xs font-medium transition-all duration-300',
        !isOnline
          ? 'bg-destructive text-destructive-foreground'
          : isSyncing
          ? 'bg-accent text-accent-foreground'
          : 'bg-primary text-primary-foreground'
      )}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Modo offline — dados salvos localmente</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Sincronizando dados...</span>
          </>
        ) : (
          <>
            <CloudUpload className="h-3.5 w-3.5" />
            <span>{pendingCount} operação(ões) pendente(s)</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-white hover:bg-white/20"
          onClick={syncNow}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sincronizar agora
        </Button>
      )}
    </div>
  );
};
