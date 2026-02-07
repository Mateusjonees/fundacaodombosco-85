/**
 * Fila de sincronização offline
 * Armazena mutações pendentes e sincroniza quando online
 */

import { offlineDB, STORES } from './offlineDB';
import { supabase } from '@/integrations/supabase/client';

export interface SyncOperation {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  key?: string; // ID do registro para update/delete
  status: 'pending' | 'syncing' | 'failed' | 'done';
  created_at: string;
  error?: string;
  retries: number;
}

/**
 * Adiciona uma operação à fila de sincronização
 */
export const addToSyncQueue = async (
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: any,
  key?: string
): Promise<void> => {
  const op: SyncOperation = {
    table,
    operation,
    data,
    key,
    status: 'pending',
    created_at: new Date().toISOString(),
    retries: 0,
  };
  await offlineDB.put(STORES.syncQueue, op);
  console.log('[SyncQueue] Operação adicionada:', operation, table);
};

/**
 * Retorna todas as operações pendentes
 */
export const getPendingOperations = async (): Promise<SyncOperation[]> => {
  const all = await offlineDB.getAll<SyncOperation>(STORES.syncQueue);
  return all.filter(op => op.status === 'pending' || op.status === 'failed');
};

/**
 * Retorna a contagem de operações pendentes
 */
export const getPendingCount = async (): Promise<number> => {
  const pending = await getPendingOperations();
  return pending.length;
};

/**
 * Executa uma operação de sincronização
 */
const executeSyncOperation = async (op: SyncOperation): Promise<boolean> => {
  try {
    switch (op.operation) {
      case 'insert': {
        const { error } = await supabase.from(op.table as any).insert([op.data]);
        if (error) throw error;
        break;
      }
      case 'update': {
        if (!op.key) throw new Error('Key required for update');
        const { error } = await supabase.from(op.table as any).update(op.data).eq('id', op.key);
        if (error) throw error;
        break;
      }
      case 'delete': {
        if (!op.key) throw new Error('Key required for delete');
        const { error } = await supabase.from(op.table as any).delete().eq('id', op.key);
        if (error) throw error;
        break;
      }
    }
    return true;
  } catch (error: any) {
    console.error('[SyncQueue] Erro ao sincronizar:', error);
    // Atualiza o status da operação com erro
    op.status = 'failed';
    op.error = error.message;
    op.retries += 1;
    await offlineDB.put(STORES.syncQueue, op);
    return false;
  }
};

/**
 * Processa toda a fila de sincronização
 * Retorna { synced, failed }
 */
export const processSyncQueue = async (): Promise<{ synced: number; failed: number }> => {
  const pending = await getPendingOperations();
  
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[SyncQueue] Processando ${pending.length} operações pendentes...`);

  let synced = 0;
  let failed = 0;

  // Processar em ordem cronológica
  const sorted = pending.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const op of sorted) {
    // Limitar retries a 5
    if (op.retries >= 5) {
      console.warn('[SyncQueue] Operação excedeu limite de retries:', op);
      failed++;
      continue;
    }

    op.status = 'syncing';
    await offlineDB.put(STORES.syncQueue, op);

    const success = await executeSyncOperation(op);
    
    if (success) {
      // Remove da fila após sucesso
      if (op.id !== undefined) {
        await offlineDB.delete(STORES.syncQueue, String(op.id));
      }
      synced++;
    } else {
      failed++;
    }
  }

  console.log(`[SyncQueue] Resultado: ${synced} sincronizados, ${failed} falharam`);
  return { synced, failed };
};

/**
 * Limpa operações concluídas da fila
 */
export const clearCompletedOperations = async (): Promise<void> => {
  const all = await offlineDB.getAll<SyncOperation>(STORES.syncQueue);
  const completed = all.filter(op => op.status === 'done');
  for (const op of completed) {
    if (op.id !== undefined) {
      await offlineDB.delete(STORES.syncQueue, String(op.id));
    }
  }
};
