import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Página pública de auto-recuperação para usuários presos em "Carregando..."
 * Limpa Service Workers, caches do navegador, IndexedDB e localStorage do app
 * e redireciona ao login.
 *
 * Uso: usuário acessa /limpar-cache e o sistema se desbloqueia sozinho.
 */
export default function ClearCache() {
  const [done, setDone] = useState(false);
  const [step, setStep] = useState('Iniciando limpeza...');

  useEffect(() => {
    (async () => {
      try {
        setStep('Removendo Service Workers...');
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }

        setStep('Limpando caches do navegador...');
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }

        setStep('Limpando dados locais...');
        try {
          // Preserva sessão Supabase para não exigir novo login se possível
          const authKey = 'sb-vqphtzkdhfzdwbumexhe-auth-token';
          const authToken = localStorage.getItem(authKey);
          localStorage.clear();
          if (authToken) localStorage.setItem(authKey, authToken);
        } catch {}

        setStep('Limpando banco offline...');
        if ('indexedDB' in window) {
          try {
            const dbs = await (indexedDB as any).databases?.();
            if (Array.isArray(dbs)) {
              await Promise.all(
                dbs
                  .filter((db: any) => db?.name)
                  .map(
                    (db: any) =>
                      new Promise<void>((resolve) => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = req.onerror = req.onblocked = () => resolve();
                      })
                  )
              );
            }
          } catch {}
        }

        setStep('Pronto! Recarregando...');
        setDone(true);
        setTimeout(() => {
          window.location.replace('/');
        }, 1200);
      } catch (e) {
        console.error('[ClearCache] erro:', e);
        setStep('Erro ao limpar. Recarregando mesmo assim...');
        setTimeout(() => window.location.replace('/'), 1500);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {done ? (
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {done ? 'Sistema atualizado!' : 'Atualizando o sistema...'}
        </h1>
        <p className="text-sm text-muted-foreground">{step}</p>
        <p className="text-xs text-muted-foreground/70">
          Fundação Dom Bosco · Clínica
        </p>
      </div>
    </div>
  );
}
