import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeFilters {
  unit?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * Hook otimizado para carregar funcionários com cache
 */
export const useEmployees = (userProfile?: any, filters?: EmployeeFilters) => {
  return useQuery({
    queryKey: ['employees', userProfile?.user_id, filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('user_id, id, name, employee_role, department, unit')
        .eq('is_active', true)
        .not('employee_role', 'is', null)
        .order('name');

      // Aplicar filtros baseados no role do usuário
      if (userProfile) {
        if (userProfile.employee_role === 'coordinator_madre') {
          query = query.not('employee_role', 'eq', 'coordinator_floresta')
                       .not('employee_role', 'eq', 'coordinator_atendimento_floresta');
        } else if (userProfile.employee_role === 'coordinator_floresta') {
          query = query.not('employee_role', 'eq', 'coordinator_madre')
                       .not('employee_role', 'eq', 'coordinator_atendimento_floresta');
        } else if (userProfile.employee_role === 'coordinator_atendimento_floresta') {
          query = query.not('employee_role', 'eq', 'coordinator_madre')
                       .not('employee_role', 'eq', 'coordinator_floresta');
        } else if (!['director', 'receptionist'].includes(userProfile.employee_role)) {
          query = query.eq('user_id', userProfile.user_id);
        }
      }

      // Filtros adicionais
      if (filters?.unit) {
        query = query.eq('unit', filters.unit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000, // 5 minutos
    enabled: !!userProfile,
  });
};
