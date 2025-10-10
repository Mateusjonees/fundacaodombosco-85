import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ScheduleFilters {
  status?: string;
  employeeId?: string;
  clientId?: string;
}

/**
 * Hook otimizado para carregar agendamentos com cache
 */
export const useSchedules = (date: Date, filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: ['schedules', format(date, 'yyyy-MM-dd'), filters],
    queryFn: async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('schedules')
        .select(`
          *,
          clients (id, name, phone, cpf, email, unit),
          profiles (id, name, employee_role, phone, unit)
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // Cache válido por 30 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

/**
 * Hook para carregar agendamentos do dia atual
 */
export const useTodaySchedules = (userProfile?: any) => {
  return useQuery({
    queryKey: ['schedules', 'today', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let query = supabase
        .from('schedules')
        .select(`
          id,
          title,
          start_time,
          status,
          clients (name),
          profiles (name)
        `)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time');

      // Staff só vê seus próprios agendamentos
      if (userProfile.employee_role === 'staff') {
        query = query.eq('employee_id', userProfile.user_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minuto
    enabled: !!userProfile,
  });
};
