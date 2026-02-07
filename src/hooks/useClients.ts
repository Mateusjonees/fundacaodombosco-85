import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, STORES } from '@/utils/offlineDB';

interface ClientFilters {
  unit?: string;
  isActive?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// Colunas otimizadas para listagem
const LIST_COLUMNS = 'id, name, cpf, phone, email, unit, is_active, birth_date, created_at';
const DETAIL_COLUMNS = '*';

/**
 * Hook otimizado para carregar clientes com cache offline
 */
export const useClients = (filters?: ClientFilters) => {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      // Tenta buscar online
      if (navigator.onLine) {
        try {
          let query = supabase
            .from('clients')
            .select(LIST_COLUMNS)
            .order('name');

          if (filters?.unit) query = query.eq('unit', filters.unit);
          if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);
          if (filters?.searchTerm) {
            query = query.or(
              `name.ilike.%${filters.searchTerm}%,cpf.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`
            );
          }
          if (filters?.limit) query = query.limit(filters.limit);
          if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

          const { data, error } = await query;
          if (error) throw error;

          const result = data || [];
          // Salva no cache local (apenas se sem filtros de busca/paginação)
          if (!filters?.searchTerm && !filters?.offset) {
            await offlineDB.putMany(STORES.clients, result).catch(() => {});
            await offlineDB.setLastSync('clients').catch(() => {});
          }
          return result;
        } catch (err) {
          console.warn('[useClients] Erro online, tentando cache:', err);
        }
      }

      // Fallback: dados offline
      console.log('[useClients] Carregando dados do cache offline');
      let cached = await offlineDB.getAll<any>(STORES.clients);
      
      // Aplica filtros localmente
      if (filters?.unit) cached = cached.filter(c => c.unit === filters.unit);
      if (filters?.isActive !== undefined) cached = cached.filter(c => c.is_active === filters.isActive);
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        cached = cached.filter(c =>
          c.name?.toLowerCase().includes(term) ||
          c.cpf?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
        );
      }
      cached.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      if (filters?.limit) cached = cached.slice(filters?.offset || 0, (filters?.offset || 0) + filters.limit);

      return cached;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para carregar detalhes completos de um cliente
 */
export const useClientDetails = (clientId: string | null) => {
  return useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select(DETAIL_COLUMNS)
            .eq('id', clientId)
            .single();
          if (error) throw error;

          // Salva detalhes no cache
          await offlineDB.put(STORES.clients, data).catch(() => {});
          return data;
        } catch (err) {
          console.warn('[useClientDetails] Erro online, tentando cache:', err);
        }
      }

      // Fallback offline
      const cached = await offlineDB.get<any>(STORES.clients, clientId);
      return cached || null;
    },
    enabled: !!clientId,
    staleTime: 30000,
  });
};

/**
 * Hook para contagem de clientes
 */
export const useClientsCount = (unit?: string) => {
  return useQuery({
    queryKey: ['clients', 'count', unit],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          let query = supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);
          if (unit) query = query.eq('unit', unit);
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        } catch {
          // Fallback
        }
      }

      // Contagem offline
      let cached = await offlineDB.getAll<any>(STORES.clients);
      cached = cached.filter(c => c.is_active !== false);
      if (unit) cached = cached.filter(c => c.unit === unit);
      return cached.length;
    },
    staleTime: 300000,
  });
};
