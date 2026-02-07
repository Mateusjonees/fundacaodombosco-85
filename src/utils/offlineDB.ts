/**
 * IndexedDB wrapper para armazenamento offline
 * Suporta cache de dados e fila de sincronização
 */

const DB_NAME = 'clinica_offline';
const DB_VERSION = 1;

// Stores disponíveis
const STORES = {
  clients: 'clients',
  schedules: 'schedules',
  medicalRecords: 'medical_records',
  dashboardStats: 'dashboard_stats',
  syncQueue: 'sync_queue',
  metadata: 'metadata',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cache stores
      if (!db.objectStoreNames.contains(STORES.clients)) {
        db.createObjectStore(STORES.clients, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.schedules)) {
        db.createObjectStore(STORES.schedules, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.medicalRecords)) {
        db.createObjectStore(STORES.medicalRecords, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.dashboardStats)) {
        db.createObjectStore(STORES.dashboardStats, { keyPath: 'key' });
      }

      // Fila de sincronização
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const syncStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Metadata (timestamps de última sync)
      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
};

// Operações genéricas
export const offlineDB = {
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  },

  async get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: StoreName, data: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
    if (!items.length) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(storeName: StoreName, key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clear(storeName: StoreName): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Metadata helpers
  async setLastSync(storeName: string): Promise<void> {
    await this.put('metadata', { key: `lastSync_${storeName}`, timestamp: Date.now() });
  },

  async getLastSync(storeName: string): Promise<number | null> {
    const meta = await this.get('metadata', `lastSync_${storeName}`) as { key: string; timestamp: number } | undefined;
    return meta?.timestamp || null;
  },
};

export { STORES };
export type { StoreName };
