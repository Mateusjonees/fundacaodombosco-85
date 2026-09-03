/**
 * Helpers de escrita com suporte offline.
 * Quando online, executa direto no Supabase.
 * Quando offline, grava no cache local (IndexedDB) e enfileira a operação.
 */

import { supabase } from '@/integrations/supabase/client';
import { offlineDB, STORES, type StoreName } from './offlineDB';
import { addToSyncQueue } from './syncQueue';

export const isOffline = () => !navigator.onLine;

/** Mapeia tabela -> store de cache local (quando existir) */
const TABLE_STORE: Record<string, StoreName> = {
  clients: STORES.clients,
  schedules: STORES.schedules,
  medical_records: STORES.medicalRecords,
};

const cachePut = async (table: string, data: any) => {
  const store = TABLE_STORE[table];
  if (!store || !data?.id) return;
  await offlineDB.put(store, data).catch(() => {});
};

/**
 * Insert com fallback offline. Sempre retorna o registro (com id).
 */
export const offlineInsert = async <T = any>(table: string, data: Record<string, any>): Promise<T> => {
  if (!isOffline()) {
    const { data: inserted, error } = await supabase
      .from(table as any)
      .insert(data as any)
      .select()
      .maybeSingle();
    if (error) throw error;
    await cachePut(table, inserted);
    return inserted as T;
  }

  const id = data.id ?? crypto.randomUUID();
  const payload = { ...data, id };
  const local = { ...payload, _offline: true, created_at: data.created_at ?? new Date().toISOString() };
  await cachePut(table, local);
  await addToSyncQueue(table, 'insert', payload);
  return local as T;
};

/**
 * Insert de múltiplos registros com fallback offline.
 */
export const offlineInsertMany = async (table: string, rows: Record<string, any>[]): Promise<void> => {
  if (!rows.length) return;
  if (!isOffline()) {
    const { error } = await supabase.from(table as any).insert(rows as any);
    if (error) throw error;
    return;
  }
  for (const row of rows) {
    const payload = { ...row, id: row.id ?? crypto.randomUUID() };
    await cachePut(table, payload);
    await addToSyncQueue(table, 'insert', payload);
  }
};

/**
 * Update por id com fallback offline (mescla no cache local).
 */
export const offlineUpdate = async (table: string, id: string, updates: Record<string, any>): Promise<void> => {
  if (!isOffline()) {
    const { error } = await supabase.from(table as any).update(updates as any).eq('id', id);
    if (error) throw error;
    const store = TABLE_STORE[table];
    if (store) {
      const existing = await offlineDB.get<any>(store, id).catch(() => undefined);
      if (existing) await offlineDB.put(store, { ...existing, ...updates }).catch(() => {});
    }
    return;
  }

  const store = TABLE_STORE[table];
  if (store) {
    const existing = await offlineDB.get<any>(store, id).catch(() => undefined);
    await offlineDB.put(store, { ...(existing || { id }), ...updates, id, _offline: true }).catch(() => {});
  }
  await addToSyncQueue(table, 'update', updates, id);
};

/**
 * Upsert com fallback offline.
 */
export const offlineUpsert = async (
  table: string,
  data: Record<string, any>,
  onConflict?: string
): Promise<void> => {
  if (!isOffline()) {
    const { error } = await supabase
      .from(table as any)
      .upsert(data as any, onConflict ? { onConflict } : undefined);
    if (error) throw error;
    return;
  }
  await addToSyncQueue(table, 'upsert', { row: data, onConflict });
};
