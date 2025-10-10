import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientFilters {
  unit?: string;
  isActive?: boolean;
  searchTerm?: string;
}

/**
 * Hook otimizado para carregar clientes com cache e filtros
 */
export const useClients = (filters?: ClientFilters) => {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name');

      if (filters?.unit) {
        query = query.eq('unit', filters.unit);
      }
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.searchTerm) {
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,cpf.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // Cache válido por 1 minuto
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para contagem de clientes (mais rápido que carregar todos)
 */
export const useClientsCount = (unit?: string) => {
  return useQuery({
    queryKey: ['clients', 'count', unit],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (unit) {
        query = query.eq('unit', unit);
      }

      const { count, error } = await query;
      
      if (error) throw error;
      return count || 0;
    },
    staleTime: 300000, // 5 minutos
  });
};
